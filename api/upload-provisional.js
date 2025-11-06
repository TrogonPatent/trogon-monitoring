/**
 * API Route: /api/upload-provisional
 * Phase A: Handle provisional patent upload
 * 
 * FIXED: Simplified form parsing with better error handling
 */

import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';

// For PDF text extraction
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not installed');
}

// Simpler: Use default body parser with size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Helper: Extract text from file
async function extractText(buffer, mimetype, filename) {
  // Text file - direct conversion
  if (mimetype === 'text/plain' || filename.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }
  
  // PDF file - use pdf-parse
  if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
    if (!pdfParse) {
      throw new Error('PDF parsing not available. Install pdf-parse package.');
    }
    
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
  
  throw new Error('Unsupported file type. Please upload PDF or TXT file.');
}

// Helper: Calculate publication deadline (filing date + 18 months)
function calculatePublicationDeadline(filingDate) {
  const date = new Date(filingDate);
  date.setMonth(date.getMonth() + 18);
  return date.toISOString().split('T')[0];
}

// Helper: Auto-generate title from filename or text
function generateTitle(filename, text) {
  // Try to extract title from filename (remove extension)
  let title = filename.replace(/\.(pdf|txt)$/i, '').replace(/[-_]/g, ' ');
  
  // If filename is generic, try to extract from first heading or first line
  const genericNames = ['provisional', 'patent', 'spec', 'specification', 'application', 'document'];
  const isGeneric = genericNames.some(name => title.toLowerCase().includes(name));
  
  if (isGeneric || title.length < 5) {
    // Try to find first heading or title in text
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      const trimmed = line.trim();
      
      // Skip common headers
      if (/^(background|summary|detailed|abstract|field|technical)/i.test(trimmed)) {
        continue;
      }
      
      // Use first substantial line (10-100 chars)
      if (trimmed.length >= 10 && trimmed.length <= 100) {
        const isAllCaps = trimmed === trimmed.toUpperCase();
        const wordCount = trimmed.split(/\s+/).length;
        
        // Use it if it's not all caps, or if all caps but reasonable length (3-10 words)
        if (!isAllCaps || (wordCount >= 3 && wordCount <= 10)) {
          title = trimmed;
          break;
        }
      }
    }
  }
  
  // Capitalize and clean up
  title = title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .substring(0, 200); // Max 200 chars
  
  // If still generic or empty, use default
  if (!title || title.length < 5) {
    title = 'Untitled Provisional Application';
  }
  
  return title;
}

export default async function handler(req, res) {
  // Enable CORS
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
    
    // For now, let's use a simpler approach - read raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);
    
    console.log('Raw body length:', rawBody.length);
    
    // Parse multipart manually (simplified)
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Invalid Content-Type. Expected multipart/form-data' });
    }
    
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const parts = rawBody.toString('binary').split(`--${boundary}`);
    
    let file = null;
    let filingDate = '';
    let isPreFiling = 'true';
    
    // Parse each part
    for (const part of parts) {
      if (!part || part === '--\r\n' || part === '--') continue;
      
      const headerEndIndex = part.indexOf('\r\n\r\n');
      if (headerEndIndex === -1) continue;
      
      const headers = part.substring(0, headerEndIndex);
      const content = part.substring(headerEndIndex + 4);
      
      // Extract field name
      const nameMatch = headers.match(/name="([^"]+)"/);
      if (!nameMatch) continue;
      
      const fieldName = nameMatch[1];
      
      // Check if it's a file
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      
      if (filenameMatch) {
        // This is a file
        const filename = filenameMatch[1];
        const mimeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);
        const mimetype = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream';
        
        // Extract file content (remove trailing boundary markers)
        const fileContent = content.substring(0, content.lastIndexOf('\r\n'));
        const buffer = Buffer.from(fileContent, 'binary');
        
        file = { filename, mimetype, buffer };
        console.log('File found:', filename, 'Size:', buffer.length, 'Type:', mimetype);
      } else {
        // This is a text field
        const value = content.substring(0, content.lastIndexOf('\r\n'));
        
        if (fieldName === 'filingDate') {
          filingDate = value;
        } else if (fieldName === 'isPreFiling') {
          isPreFiling = value;
        }
      }
    }
    
    // Validate we got a file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('Form data parsed:', { filingDate, isPreFiling, fileSize: file.buffer.length });
    
    // Validate file size (10MB limit)
    if (file.buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    
    // Extract text from file
    console.log('Extracting text from file:', file.filename);
    const extractedText = await extractText(file.buffer, file.mimetype, file.filename);
    
    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(400).json({ 
        error: 'Extracted text is too short. Please ensure the file contains a valid specification.' 
      });
    }
    
    console.log(`Extracted ${extractedText.length} characters from ${file.filename}`);
    
    // Auto-generate title from filename or first line of text
    const autoTitle = generateTitle(file.filename, extractedText);
    console.log('Generated title:', autoTitle);
    
    // Store file in Vercel Blob
    console.log('Uploading file to Vercel Blob...');
    const blob = await put(file.filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });
    
    console.log('File uploaded to:', blob.url);
    
    // Calculate publication deadline (only if filed)
    const publicationDeadline = (isPreFiling !== 'true' && filingDate) 
      ? calculatePublicationDeadline(filingDate) 
      : null;
    
    // Save to database
    console.log('Saving to database...');
    const sql = neon(process.env.DATABASE_URL);
    
    const result = await sql`
      INSERT INTO applications (
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
        ${extractedText},
        ${blob.url},
        ${file.filename},
        NOW(),
        NOW()
      )
      RETURNING id, title, filing_date, publication_deadline
    `;
    
    const application = result[0];
    
    console.log('Application saved with ID:', application.id);
    
    // Return success response
    return res.status(200).json({
      success: true,
      id: application.id,
      title: application.title,
      filingDate: application.filing_date,
      publicationDeadline: application.publication_deadline,
      isPreFiling: isPreFiling === 'true' || !filingDate,
      textLength: extractedText.length,
      extractedText: extractedText.substring(0, 500) + '...', // Send preview only
      fileUrl: blob.url,
      fileName: file.filename,
      message: 'Provisional application uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error in upload-provisional:', error);
    console.error('Error stack:', error.stack);
    
    // Return JSON error, not HTML
    return res.status(500).json({ 
      error: error.message || 'Failed to upload provisional application',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
