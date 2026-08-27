import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker source to use a CDN version matching the installed pdfjsLib version
// This avoids Vite build issues with worker files.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function parseResume(file) {
    if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are supported for autofill.');
    }

    const arrayBuffer = await file.arrayBuffer();
    
    // We wrap this in try-catch in case it fails due to worker issues
    try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Extracted text from PDF
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
        }
        
        return extractDataFromText(fullText);
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to parse the PDF document.");
    }
}

function extractDataFromText(text) {
    const data = {
        name: '',
        email: '',
        phone: ''
    };

    // Extract Email
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
        data.email = emailMatch[0];
    }

    // Extract Phone (simple heuristic for common formats)
    const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
        data.phone = phoneMatch[0];
    }

    // Extract Name (Heuristic: Look for the first few alphabetical words)
    // Clean the text by removing excessive whitespace
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const words = cleanedText.split(' ').slice(0, 10); 
    
    let possibleName = [];
    for (let word of words) {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        const lowerWord = cleanWord.toLowerCase();
        
        // Stop criteria
        if (word.includes('@') || /\d/.test(word) || ['resume', 'cv', 'curriculum', 'vitae', 'profile', 'email', 'phone'].includes(lowerWord)) {
            continue; // Skip common header words instead of breaking immediately
        }
        
        // Ensure it's a valid alphabetical word, capitalized usually but not always strictly typed
        if (cleanWord.length > 1) {
            possibleName.push(cleanWord);
        }
        
        if (possibleName.length >= 2) { // usually First Last is enough
            break;
        }
    }
    
    if (possibleName.length > 0) {
        data.name = possibleName.join(' ');
    }

    // Extract Skills (heuristic: look for common skills in a predefined list)
    const commonSkills = ['javascript', 'react', 'node', 'python', 'java', 'c++', 'html', 'css', 'sql', 'mongodb', 'express', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'leadership', 'communication', 'management'];
    const foundSkills = [];
    const lowerText = text.toLowerCase();
    for (let skill of commonSkills) {
        if (lowerText.includes(skill)) {
            // capitalise first letter
            foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
    }
    if (foundSkills.length > 0) {
        data.skills = foundSkills.join(', ');
    }

    return data;
}
