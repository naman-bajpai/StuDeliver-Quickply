import { storage } from './storage';

export interface ResumeData {
  fileName: string;
  fileData: string; // Base64 encoded file data
  fileType: string; // MIME type
  uploadedAt: string;
}

export const resumeStorage = {
  async getResume(): Promise<ResumeData | null> {
    const data = await storage.get('resume');
    return data || null;
  },

  async saveResume(resume: ResumeData): Promise<void> {
    await storage.set('resume', resume);
  },

  async deleteResume(): Promise<void> {
    await storage.set('resume', null);
  },

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async parseResumeFile(file: File): Promise<ResumeData> {
    const fileData = await this.fileToBase64(file);
    return {
      fileName: file.name,
      fileData,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
    };
  },
};

