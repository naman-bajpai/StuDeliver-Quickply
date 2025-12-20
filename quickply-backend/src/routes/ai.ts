import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireUser, type AuthedRequest } from "../auth.js";
import { env } from "../env.js";

const ExtractResumeSchema = z.object({
  fileName: z.string(),
  fileData: z.string(), // Base64 encoded
  fileType: z.string(),
});

const AutoFillSchema = z.object({
  userData: z.record(z.string(), z.any()),
  pageFields: z.array(z.any()),
});

// Simple text extraction from base64 (for PDF/DOC, you'd need proper parsing libraries)
async function extractTextFromResume(fileData: string, fileType: string): Promise<string> {
  // For now, we'll use a simple approach
  // In production, you'd want to use libraries like pdf-parse, mammoth, etc.
  
  if (fileType === 'text/plain') {
    try {
      // Decode base64 string
      const text = Buffer.from(fileData, 'base64').toString('utf-8');
      return text;
    } catch (e) {
      return '';
    }
  }
  
  // For PDF/DOC files, you'd need proper parsing
  // This is a placeholder - you'd need to install and use pdf-parse or similar
  return '';
}

// Extract structured data from resume text using AI
async function extractDataWithAI(resumeText: string): Promise<any> {
  if (env.AI_PROVIDER === 'mock') {
    // Mock extraction - in production, use OpenAI or similar
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      github: '',
      linkedin: '',
    };
  }

  if (env.AI_PROVIDER === 'openai' && env.AI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Extract structured information from this resume. Return a JSON object with the following fields: firstName, lastName, email, phone, location, github, linkedin, address, city, state, zipCode, country. Only include fields that are found in the resume.`,
            },
            {
              role: 'user',
              content: resumeText.substring(0, 8000), // Limit to avoid token limits
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      return content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  return {};
}

// Smart field matching using AI
async function smartFillWithAI(userData: any, pageFields: any[]): Promise<any> {
  if (env.AI_PROVIDER === 'mock') {
    // Mock - just return userData
    return userData;
  }

  if (env.AI_PROVIDER === 'openai' && env.AI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a form-filling assistant. Given user data and form fields from a webpage, intelligently match and fill the fields. Return a JSON object with field names as keys and values from userData that best match each field.`,
            },
            {
              role: 'user',
              content: JSON.stringify({
                userData,
                pageFields: pageFields.map(f => ({
                  name: f.name,
                  id: f.id,
                  label: f.label,
                  placeholder: f.placeholder,
                  type: f.type,
                })),
              }),
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const filledData = JSON.parse(data.choices[0].message.content);
      
      // Merge with userData
      return { ...userData, ...filledData };
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to userData
      return userData;
    }
  }

  return userData;
}

export async function aiRoutes(app: FastifyInstance) {
  // Extract data from resume
  app.post(
    "/ai/extract-resume",
    { preHandler: requireUser },
    async (req) => {
      const body = ExtractResumeSchema.parse(req.body);
      
      // Extract text from resume
      const resumeText = await extractTextFromResume(body.fileData, body.fileType);
      
      if (!resumeText) {
        return {
          success: false,
          error: "Could not extract text from resume. Please ensure the file is readable.",
        };
      }

      // Extract structured data using AI
      const extractedData = await extractDataWithAI(resumeText);

      return {
        success: true,
        extractedData,
      };
    }
  );

  // Auto-fill form fields using AI
  app.post(
    "/ai/auto-fill",
    { preHandler: requireUser },
    async (req) => {
      const body = AutoFillSchema.parse(req.body);
      
      // Use AI to intelligently fill fields
      const filledData = await smartFillWithAI(body.userData, body.pageFields);

      return {
        success: true,
        filledData,
      };
    }
  );
}

