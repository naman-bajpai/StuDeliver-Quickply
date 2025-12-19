import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const EnvSchema = z.object({
    PORT: z.string().optional().default("8787"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
    AI_API_KEY: z.string().optional(),
    AI_PROVIDER: z.enum(["mock", "openai"]).optional().default("mock")
});
export const env = EnvSchema.parse(process.env);
