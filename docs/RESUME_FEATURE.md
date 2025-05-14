wwwsww# Resume Upload Feature

The Resume Upload feature allows candidates to share their resume with the interviewer AI, which then personalizes the interview based on their experience and skills.

## Supported File Formats

- PDF (`.pdf`)
- Plain text (`.txt`)
- Markdown (`.md`)
- Rich Text Format (`.rtf`)
- Microsoft Word documents (`.doc`, `.docx`)

## How it Works

1. Click the resume button (document icon) in the control tray
2. Upload your resume by either:
   - Clicking to browse for a file
   - Dragging and dropping a file onto the upload area
3. The system will extract text from the resume and show a preview
4. Click "Submit Resume" to share your resume with the interviewer

## Technical Implementation

The resume feature uses:
- PDF.js for parsing PDF documents
- FileReader API for text-based documents
- Drag and drop capabilities for easier file uploading

## Resume Processing Flow

1. User uploads resume
2. Content is extracted from the file
3. Text content is sent to the AI model
4. AI analyzes the resume and tailors the interview questions
5. The interview continues based on the user's experience and skills

## Troubleshooting

If you experience issues with resume parsing:
- Try a different file format (PDF files generally work best)
- Ensure your file is not encrypted or password protected
- For complex formatted documents, consider saving as a plain text file first
