/**
 * API Route: /api/upload-provisional
 * Phase A: Handle provisional patent upload
 * 
 * 1. Accept file upload (PDF or TXT)
 * 2. Extract text from file
 * 3. Store file in Vercel Blob
 * 4. Save application record to database
 * 5. Return application ID and extracted text
 */

import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';

// For PDF text extraction - install with: npm install pdf-parse
// Note: pdf-parse works in Node.js environment
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not installed. Run: npm install pdf-parse');
}

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

// Helper: Parse multipart form data
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const parts = buffer.toString('binary').split(`--${boundary}`);
        
        const formData = {};
        const files = {};
        
        for (const part of parts) {
          if (part.includes('Content-Disposition')) {
            const nameMatch = part.match(/name="([^"]+)"/);
            if (!nameMatch) continue;
            
            const fieldName = nameMatch[1];
            const filenameMatch = part.match(/filename="([^"]+)"/);
            
            if (filenameMatch) {
              // This is a file
              const contentStart = part.indexOf('\r\n\r\n') + 4;
              const contentEnd = part.lastIndexOf('\r\n');
              const fileBuffer = Buffer.from(part.substring(contentStart, contentEnd), 'binary');
              
              files[fieldName] = {
                filename: filenameMatch[1],
                buffer: fileBuffer,
                mimetype: part.match(/Content-Type: ([^\r\n]+)/)?.[1] || 'application/octet-stream'
              };
            } else {
              // This is a text field
              const contentStart = part.indexOf('\r\n\r\n') + 4;
              const contentEnd = part.lastIndexOf('\r\n');
              formData[fieldName] = part.substring(contentStart, contentEnd);
            }
          }
        }
        
        resolve({ formData, files });
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// Helper: Extract text from file
async function extractText(file) {
  const { buffer, mimetype, filename } = file;
  
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const { formData, files } = await parseFormData(req);
    
    // Validate required fields
    const { filingDate, isPreFiling } = formData;
    const file = files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }
    
    // Validate file size (10MB limit)
    if (file.buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    
    // Extract text from file
    console.log('Extracting text from file:', file.filename);
    const extractedText = await extractText(file);
    
    if (!extractedText || extractedText.trim().length < 100) {
      return res.status(400).json({ 
        error: 'Extracted text is too short. Please ensure the file contains a valid specification.' 
      });
    }
    
    console.log(`Extracted ${extractedText.length} characters from ${file.filename}`);
    
    // Auto-generate title from filename or first line of text
    const autoTitle = generateTitle(file.filename, extractedText);
    
    // Store file in Vercel Blob
    console.log('Uploading file to Vercel Blob...');
    const blob = await put(file.filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });
    
    console.log('File uploaded to:', blob.url);
    
    // Calculate publication deadline (only if filed)
    const publicationDeadline = (isPreFiling === 'false' && filingDate) 
      ? calculatePublicationDeadline(filingDate) 
      : null;
    
    // Save to database
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
    return res.status(500).json({ 
      error: error.message || 'Failed to upload provisional application' 
    });
  }
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
      
      // Use first substantial line (10-100 chars, not all caps unless reasonable)
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
