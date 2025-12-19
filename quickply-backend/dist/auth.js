import { supabaseAdmin } from "./supabase.js";
export async function requireUser(req) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        const err = new Error("Missing Authorization: Bearer token");
        err.statusCode = 401;
        throw err;
    }
    const token = auth.slice("Bearer ".length);
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
        const err = new Error("Invalid token");
        err.statusCode = 401;
        throw err;
    }
    req.user = {
        id: data.user.id,
        email: data.user.email
    };
}
