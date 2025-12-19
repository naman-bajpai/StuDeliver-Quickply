import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireUser, type AuthedRequest } from "../auth.js";
import { supabaseAdmin } from "../supabase.js";

const PatchSchema = z.object({
  // Send any JSON object; you can enforce schema later
  data: z.record(z.any(), z.any())
});

export async function profileRoutes(app: FastifyInstance) {
  // Proxy read profile (mainly useful if you want extra validation)
  app.get("/profile", { preHandler: requireUser }, async (req) => {
    const userId = (req as AuthedRequest).user.id;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("schema_version,data,updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    // ensure row exists
    if (!data) {
      const empty = { basics: {}, eligibility: {}, education: [], experience: {}, baseAnswers: {}, preferences: {} };
      const { error: insErr } = await supabaseAdmin
        .from("profiles")
        .insert({ user_id: userId, data: empty, schema_version: 1 });
      if (insErr) throw insErr;

      return { schema_version: 1, data: empty };
    }

    return data;
  });

  // Patch profile + snapshot version
  app.patch("/profile", { preHandler: requireUser }, async (req) => {
    const userId = (req as AuthedRequest).user.id;
    const body = PatchSchema.parse(req.body);

    // Load current
    const { data: current, error: curErr } = await supabaseAdmin
      .from("profiles")
      .select("data,schema_version")
      .eq("user_id", userId)
      .maybeSingle();
    if (curErr) throw curErr;

    const nextData = { ...(current?.data ?? {}), ...body.data };

    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: userId, data: nextData, schema_version: current?.schema_version ?? 1 });
    if (upErr) throw upErr;

    // snapshot
    const { error: snapErr } = await supabaseAdmin
      .from("profile_versions")
      .insert({ user_id: userId, data: nextData, note: "patch" });
    if (snapErr) {
      // Log but don't fail the request if snapshot fails
      console.error("Failed to create profile snapshot:", snapErr);
    }

    return { ok: true, data: nextData };
  });
}
