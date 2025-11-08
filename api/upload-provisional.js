/**
 * API Route: /api/upload-provisional
 * Phase A: Handle provisional patent upload (MULTIPLE FILES)
 * Supports: .txt, .docx, .pdf
 */

import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb', // Increased for multiple files
    },
  },
};

// Helper: Extract text from file
async function extractText(buffer, mimetype, filename) {
  // Text file
  if (mimetype === 'text/plain' || filename.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }
  
  // DOCX file
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filename.endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }
  
  // PDF file
  if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
  
  // If we can't extract text, return empty (e.g., for image PDFs)
  console.warn(`Cannot extract text from ${filename} (${mimetype}), treating as attachment`);
  return '';
}

// Helper: Calculate publication deadline
function calculatePublicationDeadline(filingDate) {
  const date = new Date(filingDate);
  date.setMonth(date.getMonth() + 18);
  return date.toISOString().split('T')[0];
}

// Helper: Generate title
function generateTitle(filename, text) {
  let title = filename.replace(/\.(pdf|txt|docx)$/i, '').replace(/[-_]/g, ' ');
  
  const genericNames = ['provisional', 'patent', 'spec', 'specification', 'application', 'document', 'drawing'];
  const isGeneric = genericNames.some(name => title.toLowerCase().includes(name));
  
  if (isGeneric || title.length < 5) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines.slice(0, 10)) {
      const trimmed = line.trim();
      
      if (/^(background|summary|detailed|abstract|field|technical)/i.test(trimmed)) {
        continue;
      }
      
      if (trimmed.length >= 10 && trimmed.length <= 100) {
        const isAllCaps = trimmed === trimmed.toUpperCase();
        const wordCount = trimmed.split(/\s+/).length;
        
        if (!isAllCaps || (wordCount >= 3 && wordCount <= 10)) {
          title = trimmed;
          break;
        }
      }
    }
  }
  
  title = title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .substring(0, 200);
  
  if (!title || title.length < 5) {
    title = 'Untitled Provisional Application';
  }
  
  return title;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Upload request received');
    console.log('Content-Type:', req.headers['content-type']);
    
    // Read raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);
    
    console.log('Raw body length:', rawBody.length);
    
    // Parse multipart
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Invalid Content-Type' });
    }
    
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const parts = rawBody.toString('binary').split(`--${boundary}`);
    
    const files = []; // CHANGED: Collect ALL files
    let filingDate = '';
    let isPreFiling = 'true';
    
    // Parse each part
    for (const part of parts) {
      if (!part || part === '--\r\n' || part === '--') continue;
      
      const headerEndIndex = part.indexOf('\r\n\r\n');
      if (headerEndIndex === -1) continue;
      
      const headers = part.substring(0, headerEndIndex);
      const content = part.substring(headerEndIndex + 4);
      
      const nameMatch = headers.match(/name="([^"]+)"/);
      if (!nameMatch) continue;
      
      const fieldName = nameMatch[1];
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      
      if (filenameMatch) {
        // This is a file
        const filename = filenameMatch[1];
        const mimeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);
        const mimetype = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream';
        
        const fileContent = content.substring(0, content.lastIndexOf('\r\n'));
        const buffer = Buffer.from(fileContent, 'binary');
        
        files.push({ filename, mimetype, buffer }); // CHANGED: Push to array
        console.log('File found:', filename, 'Size:', buffer.length, 'Type:', mimetype);
      } else {
        // Text field
        const value = content.substring(0, content.lastIndexOf('\r\n'));
        
        if (fieldName === 'filingDate') {
          filingDate = value;
        } else if (fieldName === 'isPreFiling') {
          isPreFiling = value;
        }
      }
    }
    
    // Validate we got at least one file
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    console.log(`Processing ${files.length} file(s)`);
    
    // Extract text from ALL files and combine
    const extractedTexts = [];
    const fileUrls = [];
    const fileNames = [];
    
    for (const file of files) {
      console.log(`Extracting text from: ${file.filename}`);
      
      const text = await extractText(file.buffer, file.mimetype, file.filename);
      
      if (text && text.trim().length > 0) {
        extractedTexts.push(`\n\n=== ${file.filename} ===\n\n${text}`);
        console.log(`Extracted ${text.length} characters from ${file.filename}`);
      } else {
        console.log(`No text extracted from ${file.filename} (may be drawings/images)`);
      }
      
      // Upload ALL files to Vercel Blob
      console.log(`Uploading ${file.filename} to Vercel Blob...`);
      const blob = await put(file.filename, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
      });
      
      fileUrls.push(blob.url);
      fileNames.push(file.filename);
      console.log(`Uploaded: ${blob.url}`);
    }
    
    // Combine all extracted text
    const combinedText = extractedTexts.join('\n\n');
    
    if (!combinedText || combinedText.trim().length < 100) {
      return res.status(400).json({ 
        error: 'Extracted text is too short. Please ensure at least one file contains a valid specification.' 
      });
    }
    
    console.log(`Total extracted text: ${combinedText.length} characters from ${files.length} file(s)`);
    
    // Generate title from first text-containing file
    const autoTitle = generateTitle(files[0].filename, combinedText);
    console.log('Generated title:', autoTitle);
    
    // Calculate publication deadline
    const publicationDeadline = (isPreFiling !== 'true' && filingDate) 
      ? calculatePublicationDeadline(filingDate) 
      : null;
    
    // Save to database
    console.log('Saving to database...');
    const sql = neon(process.env.DATABASE_URL);
    
    const result = await sql`
      INSERT INTO public.applications (
        title,
        filing_date,
        publication_deadline,
        is_provisional,
        specification_text,
        file_url,
        file_name,
        created_at,
        updated_at
      ) VALUES (
        ${autoTitle},
        ${filingDate || null},
        ${publicationDeadline},
        true,
        ${combinedText},
        ${JSON.stringify(fileUrls)},
        ${JSON.stringify(fileNames)},
        NOW(),
        NOW()
      )
      RETURNING id, title, filing_date, publication_deadline
    `;
    
    const application = result[0];
    
    console.log('Application saved with ID:', application.id);
    
    return res.status(200).json({
      success: true,
      id: application.id,
      title: application.title,
      filingDate: application.filing_date,
      publicationDeadline: application.publication_deadline,
      isPreFiling: isPreFiling === 'true' || !filingDate,
      fileCount: files.length,
      fileNames: fileNames,
      textLength: combinedText.length,
      extractedText: combinedText.substring(0, 500) + '...',
      fileUrls: fileUrls,
      message: `${files.length} file(s) uploaded successfully`
    });
    
  } catch (error) {
    console.error('Error in upload-provisional:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: error.message || 'Failed to upload provisional application',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
