import { supabase } from './supabase';
import { UserData } from './storage';
import { ResumeData } from './resume';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

export interface AIExtractedData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export async function extractDataFromResume(resume: ResumeData): Promise<AIExtractedData> {
  try {
    // Get the current user's session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated. Please sign in.');
    }

    // Call backend AI endpoint
    const response = await fetch(`${BACKEND_URL}/ai/extract-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileName: resume.fileName,
        fileData: resume.fileData,
        fileType: resume.fileType,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to extract data from resume' }));
      throw new Error(error.message || 'Failed to extract data from resume');
    }

    const data = await response.json();
    return data.extractedData || {};
  } catch (error: any) {
    console.error('Error extracting data from resume:', error);
    throw error;
  }
}

export async function autoFillWithAI(userData: UserData, pageFields: any[]): Promise<UserData> {
  try {
    // Get the current user's session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated. Please sign in.');
    }

    // Call backend AI endpoint for smart filling
    const response = await fetch(`${BACKEND_URL}/ai/auto-fill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userData,
        pageFields,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to auto-fill with AI' }));
      throw new Error(error.message || 'Failed to auto-fill with AI');
    }

    const data = await response.json();
    return data.filledData || userData;
  } catch (error: any) {
    console.error('Error auto-filling with AI:', error);
    throw error;
  }
}

