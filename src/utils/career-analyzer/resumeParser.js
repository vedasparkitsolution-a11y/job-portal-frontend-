/**
 * Resume Parser — Extracts text content from uploaded PDF files
 * Uses PDF.js (Mozilla's free library) for client-side PDF parsing
 */
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js - Using a confirmed CDN path for version 5.x
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Extract text from a PDF file
 * @param {File} file - The uploaded PDF file
 * @returns {Promise<string>} - The extracted text content
 */
export const extractTextFromPDF = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF. Please ensure the file is a valid PDF.');
    }
};

/**
 * Check if a file is a valid PDF
 * @param {File} file
 * @returns {boolean}
 */
export const isValidPDF = (file) => {
    return file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
};
