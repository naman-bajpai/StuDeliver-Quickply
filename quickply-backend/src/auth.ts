import type { FastifyRequest } from "fastify";
import { supabaseAdmin } from "./supabase.js";

export type AuthedRequest = FastifyRequest & {
  user: { id: string; email?: string | null };
};

export async function requireUser(req: FastifyRequest) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    const err: any = new Error("Missing Authorization: Bearer token");
    err.statusCode = 401;
    throw err;
  }

  const token = auth.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    const err: any = new Error("Invalid token");
    err.statusCode = 401;
    throw err;
  }

  (req as AuthedRequest).user = {
    id: data.user.id,
    email: data.user.email
  };
}
