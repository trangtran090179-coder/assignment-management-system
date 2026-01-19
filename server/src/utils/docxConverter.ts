import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

export async function getDocxPreview(filePath: string): Promise<string> {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        
        // Get first 500 characters as preview
        const preview = result.value.substring(0, 500);
        return preview;
    } catch (error) {
        console.error('Error converting DOCX file:', error);
        return '';
    }
}

export async function convertDocxToHtml(filePath: string): Promise<string> {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        
        return result.value;
    } catch (error) {
        console.error('Error converting DOCX to HTML:', error);
        return '';
    }
}
