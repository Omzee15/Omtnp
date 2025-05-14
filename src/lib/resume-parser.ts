/**
 * Utility functions for parsing resume content
 */

/**
 * Simple text extractor that works with multiple file formats.
 * For PDF files, this is used as a backup if PDF.js fails.
 */
export const extractTextFromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        
        if (typeof result === 'string') {
          resolve(result);
        } else if (result instanceof ArrayBuffer) {
          // For binary formats, try to extract any visible text
          const textDecoder = new TextDecoder('utf-8');
          try {
            const text = textDecoder.decode(result);
            // Cleanup text - replace non-printable characters
            const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                                 .replace(/\s+/g, ' ')
                                 .trim();
            resolve(cleanText);
          } catch (e) {
            reject(new Error("Could not decode file content"));
          }
        } else {
          reject(new Error("Unsupported file format"));
        }
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => reject(err);
    
    if (file.type === "application/pdf") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

/**
 * Resume parser utility to extract key information from resume text
 */

interface ResumeSection {
  contact: string[];
  summary: string[];
  experience: string[];
  education: string[];
  skills: string[];
  projects: string[];
}

interface ParsedResume {
  sections: ResumeSection;
  projects: ProjectInfo[];
  technologies: string[];
}

interface ProjectInfo {
  title: string;
  description: string;
  technologies: string[];
}

/**
 * Parse resume text to extract structured information
 */
export function parseResume(text: string): ParsedResume {
  // Initialize section containers
  const sections: ResumeSection = {
    contact: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: []
  };
  
  let currentSection: keyof ResumeSection | null = null;
  
  // Split text into lines and process each line
  const lines = text.split('\n');
  
  for (const line of lines) {
    const normalizedLine = line.trim().toLowerCase();
    
    // Try to identify section headers
    if (normalizedLine.includes('contact') || 
        normalizedLine.includes('email') || 
        normalizedLine.includes('phone')) {
      currentSection = 'contact';
      continue;
    } else if (normalizedLine.includes('summary') || 
              normalizedLine.includes('objective') || 
              normalizedLine.includes('profile')) {
      currentSection = 'summary';
      continue;
    } else if (normalizedLine.includes('experience') || 
              normalizedLine.includes('employment') || 
              normalizedLine.includes('work history')) {
      currentSection = 'experience';
      continue;
    } else if (normalizedLine.includes('education') || 
              normalizedLine.includes('academic')) {
      currentSection = 'education';
      continue;
    } else if (normalizedLine.includes('skills') || 
              normalizedLine.includes('technologies') || 
              normalizedLine.includes('proficiencies')) {
      currentSection = 'skills';
      continue;
    } else if (normalizedLine.includes('project') || 
              normalizedLine.includes('portfolio')) {
      currentSection = 'projects';
      continue;
    }
    
    if (currentSection && line.trim()) {
      sections[currentSection].push(line.trim());
    }
  }
  
  // Extract potential technologies
  const techKeywords = [
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
    'tensorflow', 'pytorch', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'firebase',
    'git', 'jenkins', 'ci/cd', 'agile', 'scrum', 'rest api', 'graphql', 'microservices',
    'typescript', 'flutter', 'react native', 'android', 'ios'
  ];
  
  const technologies: string[] = [];
  
  // Find technologies from the entire resume
  const fullResumeText = text.toLowerCase();
  techKeywords.forEach(tech => {
    if (fullResumeText.includes(tech)) {
      technologies.push(tech);
    }
  });
  
  // Extract projects information
  const projects: ProjectInfo[] = extractProjects(sections.projects, sections.experience, technologies);
  
  return {
    sections,
    projects,
    technologies
  };
}

/**
 * Extract projects from resume sections
 */
function extractProjects(
  projectsSection: string[], 
  experienceSection: string[],
  technologies: string[]
): ProjectInfo[] {
  const projects: ProjectInfo[] = [];
  
  // First try to extract projects from dedicated projects section
  if (projectsSection.length > 0) {
    let currentProject: ProjectInfo | null = null;
    
    projectsSection.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if this is a new project title (usually short, ends with a colon or is all caps)
      if (trimmedLine.length < 100 && 
          (trimmedLine.endsWith(':') || 
           /[A-Z]{3,}/.test(trimmedLine) || 
           /^[A-Z][\w\s-]+(\s*[-–]\s*\w+|:|\|)/.test(trimmedLine))) {
        
        // Save previous project if exists
        if (currentProject) {
          projects.push(currentProject);
        }
        
        // Start new project
        currentProject = {
          title: trimmedLine.replace(/[:|\-–]$/, '').trim(),
          description: '',
          technologies: []
        };
      } 
      // Add to current project description
      else if (currentProject) {
        currentProject.description += ' ' + trimmedLine;
        
        // Check for technologies in this line
        technologies.forEach(tech => {
          if (line.toLowerCase().includes(tech) && 
              !currentProject!.technologies.includes(tech)) {
            currentProject!.technologies.push(tech);
          }
        });
      }
    });
    
    // Add the last project
    if (currentProject) {
      projects.push(currentProject);
    }
  }
  
  // If no projects found, try to extract from experience section
  if (projects.length === 0 && experienceSection.length > 0) {
    let currentProject: ProjectInfo | null = null;
    let inProject = false;
    
    experienceSection.forEach(line => {
      const trimmedLine = line.trim().toLowerCase();
      
      // Look for project mentions in experience
      if (trimmedLine.includes('project:') || 
          trimmedLine.includes('developed') || 
          trimmedLine.includes('implemented') ||
          trimmedLine.includes('built') ||
          trimmedLine.includes('created')) {
        
        if (currentProject) {
          projects.push(currentProject);
        }
        
        currentProject = {
          title: line.trim(),
          description: '',
          technologies: []
        };
        inProject = true;
      } 
      else if (inProject && currentProject) {
        currentProject.description += ' ' + line.trim();
        
        // Check for technologies in this line
        technologies.forEach(tech => {
          if (line.toLowerCase().includes(tech) && 
              !currentProject!.technologies.includes(tech)) {
            currentProject!.technologies.push(tech);
          }
        });
      }
    });
    
    // Add the last project
    if (currentProject) {
      projects.push(currentProject);
    }
  }
  
  // Clean up project descriptions
  projects.forEach(project => {
    project.description = project.description.trim();
    if (project.description.length > 500) {
      project.description = project.description.substring(0, 500) + '...';
    }
  });
  
  return projects;
}

export default parseResume;
