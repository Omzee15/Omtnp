import React, { useState, useRef, useEffect } from 'react';
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import * as pdfjs from 'pdfjs-dist';
import parseResume from '../../lib/resume-parser';
import './resume-upload.scss';

// Set up the PDF.js worker
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function ResumeUpload({ onClose }: { onClose: () => void }) {
  const [resumeText, setResumeText] = useState<string>("");
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { client } = useLiveAPIContext();
  const dropAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add drag and drop event handlers
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;
    
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const highlight = () => {
      dropArea.classList.add('highlight');
    };
    
    const unhighlight = () => {
      dropArea.classList.remove('highlight');
    };
    
    const handleDrop = (e: DragEvent) => {
      unhighlight();
      const dt = e.dataTransfer;
      if (dt?.files && dt.files.length > 0) {
        handleFiles(dt.files[0]);
      }
    };
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.removeEventListener(eventName, preventDefaults);
      });
      
      ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.removeEventListener(eventName, highlight);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        dropArea.removeEventListener(eventName, unhighlight);
      });
      
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    handleFiles(file);
  };

  const handleFiles = async (file: File) => {
    setIsLoading(true);
    setError("");
    setFileName(file.name);

    try {
      const text = await extractTextFromFile(file);
      if (text && text.trim()) {
        setResumeText(text);
        
        // Parse the resume to extract structured information
        const parsed = parseResume(text);
        setParsedResume(parsed);
      } else {
        throw new Error("Could not extract text from this file.");
      }
    } catch (err) {
      console.error("File processing error:", err);
      setError("Failed to read the file. Please try another file format.");
    } finally {
      setIsLoading(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "application/pdf") {
      return extractTextFromPdf(file);
    } else if (
      file.type === "text/plain" ||
      file.type === "application/rtf" ||
      file.type.includes("document") ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md')
    ) {
      return extractTextFromTextFile(file);
    } else {
      throw new Error("Unsupported file type. Please upload a PDF, DOC, TXT, or RTF file.");
    }
  };

  const extractTextFromTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          resolve(text);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
          const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
          
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText);
        } catch (err) {
          console.error("PDF extraction error:", err);
          reject(err);
        }
      };

      fileReader.onerror = (err) => reject(err);
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = () => {
    if (!resumeText.trim()) {
      setError("Please upload a resume first");
      return;
    }

    // Format projects for easier discussion
    let projectsList = "";
    if (parsedResume && parsedResume.projects && parsedResume.projects.length > 0) {
      projectsList = "\n\nProjects identified in resume:\n";
      parsedResume.projects.forEach((project: any, index: number) => {
        projectsList += `${index + 1}. ${project.title}\n`;
        if (project.technologies && project.technologies.length > 0) {
          projectsList += `   Technologies: ${project.technologies.join(', ')}\n`;
        }
      });
    }

    // Format skills/technologies
    let techList = "";
    if (parsedResume && parsedResume.technologies && parsedResume.technologies.length > 0) {
      techList = "\n\nTechnologies/Skills identified:\n";
      techList += parsedResume.technologies.join(', ');
    }

    // Send the resume to the model with structured information
    client.send([
      { text: "Here's my resume for your reference:" + projectsList + techList },
      { text: resumeText }
    ]);
    
    onClose();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="resume-upload-modal">
      <div className="resume-upload-content">
        <div className="resume-upload-header">
          <h2>Upload Your Resume</h2>
          <button className="close-button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="resume-upload-body">
          <p>Upload your resume to customize your interview with project-specific discussions</p>
          
          <div 
            className="upload-area" 
            onClick={handleBrowseClick}
            ref={dropAreaRef}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept=".pdf,.doc,.docx,.txt,.rtf,.md"
              style={{ display: 'none' }}
            />
            <span className="material-symbols-outlined upload-icon">upload_file</span>
            <p>{fileName || "Click to browse or drag and drop your resume"}</p>
          </div>

          {isLoading && <div className="loading">Processing your resume...</div>}
          
          {error && <div className="error-message">{error}</div>}

          {parsedResume && parsedResume.projects && parsedResume.projects.length > 0 && (
            <div className="resume-preview">
              <h3>Projects Identified</h3>
              <div className="preview-content projects-list">
                <ul>
                  {parsedResume.projects.map((project: any, idx: number) => (
                    <li key={idx}>
                      <strong>{project.title}</strong>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="project-tech">Technologies: {project.technologies.join(', ')}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="button-container">
            <button 
              className="cancel-button" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="submit-button" 
              onClick={handleSubmit}
              disabled={isLoading || !resumeText}
            >
              Submit Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
