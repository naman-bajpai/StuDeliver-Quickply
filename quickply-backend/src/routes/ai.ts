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
  pageContext: z.object({
    title: z.string().optional(),
    url: z.string().optional(),
    formTitle: z.string().optional(),
    formDescription: z.string().optional(),
  }).optional(),
  resumeData: z.object({
    fileName: z.string(),
    fileData: z.string(),
    fileType: z.string(),
  }).nullable().optional(),
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

// Smart field matching using AI with resume and page context
async function smartFillWithAI(
  userData: any, 
  pageFields: any[], 
  pageContext?: any,
  resumeData?: any
): Promise<any> {
  if (env.AI_PROVIDER === 'mock') {
    // Mock - just return userData
    return userData;
  }

  if (env.AI_PROVIDER === 'openai' && env.AI_API_KEY) {
    try {
      // Extract resume text if available
      let resumeText = '';
      if (resumeData) {
        resumeText = await extractTextFromResume(resumeData.fileData, resumeData.fileType);
      }

      // Build comprehensive prompt
      const systemPrompt = `You are an intelligent form-filling assistant. Your task is to:
1. Extract ALL relevant information from the user's resume (if provided)
2. Analyze the webpage context to understand what information is needed
3. Combine resume data with existing user data to create a complete profile
4. Return enhanced user data with all extracted and inferred information

Return a JSON object with these fields (only include fields you can extract or infer):
- firstName, lastName, email, phone, location, github, linkedin
- address, city, state, zipCode, country

Use the resume as the primary source, supplement with existing userData, and infer missing fields when possible based on context.`;

      const userPrompt = `Page Context:
- Title: ${pageContext?.title || 'Unknown'}
- URL: ${pageContext?.url || 'Unknown'}
- Form Title: ${pageContext?.formTitle || 'N/A'}
- Form Description: ${pageContext?.formDescription || 'N/A'}

Form Fields on Page:
${JSON.stringify(pageFields.map(f => ({
  selector: f.selector,
  name: f.name,
  id: f.id,
  label: f.label,
  placeholder: f.placeholder,
  type: f.type,
  context: f.context,
  required: f.required,
})), null, 2)}

${resumeText ? `\n=== RESUME CONTENT (Extract all information from this) ===\n${resumeText.substring(0, 8000)}\n=== END RESUME ===` : '\nNo resume provided.'}

Existing User Data:
${JSON.stringify(userData, null, 2)}

Instructions:
1. Extract ALL relevant information from the resume (name, email, phone, location, GitHub, LinkedIn, address, etc.)
2. Use the form fields and page context to understand what information is being requested
3. Combine resume data with existing userData (resume takes priority for conflicts)
4. Infer missing information when possible (e.g., if resume has city/state, create location field)
5. Return a complete userData object with all extracted and enhanced information

Return ONLY a JSON object with userData fields (firstName, lastName, email, phone, location, github, linkedin, address, city, state, zipCode, country).`;

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
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      // The AI returns enhanced userData with all extracted information
      // Merge with existing userData (AI data takes priority)
      const result = { ...userData };
      
      // Extract all userData fields from AI response
      const userDataFields = ['firstName', 'lastName', 'email', 'phone', 'location', 
                              'github', 'linkedin', 'address', 'city', 'state', 'zipCode', 'country'];
      
      for (const field of userDataFields) {
        if (aiResponse[field] && typeof aiResponse[field] === 'string' && aiResponse[field].trim()) {
          result[field] = aiResponse[field].trim();
        }
      }
      
      // If location wasn't directly extracted but we have city/state, create it
      if (!result.location && (result.city || result.state)) {
        const locationParts = [result.city, result.state].filter(Boolean);
        if (locationParts.length > 0) {
          result.location = locationParts.join(', ');
        }
      }
      
      return result;
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
      
      // Use AI to intelligently fill fields with resume and page context
      const filledData = await smartFillWithAI(
        body.userData, 
        body.pageFields,
        body.pageContext,
        body.resumeData || undefined
      );

      return {
        success: true,
        filledData,
      };
    }
  );
}

