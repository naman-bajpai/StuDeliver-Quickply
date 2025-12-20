import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { resumeStorage, ResumeData } from '../lib/resume';
import { extractDataFromResume } from '../lib/ai';
import { UserData } from '../lib/storage';

interface ResumeUploadProps {
  onResumeUploaded?: (resume: ResumeData) => void;
  onDataExtracted?: (data: Partial<UserData>) => void;
  existingResume?: ResumeData | null;
}

export default function ResumeUpload({ 
  onResumeUploaded, 
  onDataExtracted,
  existingResume 
}: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [resume, setResume] = useState<ResumeData | null>(existingResume || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError('');
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    try {
      const resumeData = await resumeStorage.parseResumeFile(file);
      await resumeStorage.saveResume(resumeData);
      setResume(resumeData);
      onResumeUploaded?.(resumeData);

      // Automatically extract data from resume
      setExtracting(true);
      try {
        const extractedData = await extractDataFromResume(resumeData);
        onDataExtracted?.(extractedData);
      } catch (extractError: any) {
        console.error('Error extracting data:', extractError);
        // Don't show error for extraction failure, just log it
      } finally {
        setExtracting(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await resumeStorage.deleteResume();
      setResume(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove resume');
    }
  };

  return (
    <div className="resume-upload-container">
      {!resume ? (
        <div
          className={`resume-drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <div className="upload-status">
              <div className="spinner"></div>
              <p>Uploading resume...</p>
            </div>
          ) : extracting ? (
            <div className="upload-status">
              <div className="spinner"></div>
              <p>Extracting information...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <p className="upload-text">
                <strong>Drag and drop your resume here</strong>
                <br />
                or click to browse
              </p>
              <p className="upload-hint">PDF, DOC, DOCX, or TXT (max 5MB)</p>
            </>
          )}
        </div>
      ) : (
        <div className="resume-info">
          <div className="resume-file-info">
            <span className="file-icon">📄</span>
            <div className="file-details">
              <p className="file-name">{resume.fileName}</p>
              <p className="file-date">
                Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button 
            className="remove-resume-btn" 
            onClick={handleRemove}
            disabled={uploading}
          >
            Remove
          </button>
        </div>
      )}
      {error && <div className="resume-error">{error}</div>}
    </div>
  );
}

