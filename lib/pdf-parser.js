// lib/pdf-parser.js
export async function extractTextFromPDF(pdfBuffer) {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text extracted from PDF');
    }
    
    return data.text;
    
  } catch (error) {
    console.error('PDF parsing failed:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}

export function validatePDFFile(file) {
  const maxSize = 25 * 1024 * 1024; // 25MB
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 25MB' };
  }
  
  return { valid: true };
}

export function cleanExtractedText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
