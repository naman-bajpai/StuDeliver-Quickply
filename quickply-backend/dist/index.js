import Fastify from "fastify";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { profileRoutes } from "./routes/profile.js";
import { aiRoutes } from "./routes/ai.js";
const app = Fastify({ logger: true });
// Enable CORS for extension
app.register(async function (fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (request.method === 'OPTIONS') {
            reply.send();
        }
    });
});
app.register(healthRoutes);
app.register(profileRoutes);
app.register(aiRoutes);
app.listen({ port: Number(env.PORT), host: "0.0.0.0" }).catch((e) => {
    app.log.error(e);
    process.exit(1);
});
