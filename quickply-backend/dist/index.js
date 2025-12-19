import Fastify from "fastify";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { profileRoutes } from "./routes/profile.js";
const app = Fastify({ logger: true });
app.register(healthRoutes);
app.register(profileRoutes);
app.listen({ port: Number(env.PORT), host: "0.0.0.0" }).catch((e) => {
    app.log.error(e);
    process.exit(1);
});
