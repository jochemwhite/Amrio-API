import { Hono } from "hono";
import { cors } from "hono/cors";
import { cmsRoutes } from "./routes/cms";
import { env } from "./lib/env";
import { rateLimit } from "./middleware/rateLimit";
import { apiKeyAuth } from "./middleware/auth";

const app = new Hono();

// Add CORS middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], 
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) => {
  return c.json({ message: "Amrio CMS API", version: "1.0.0" });
});

app.use("*", rateLimit());
app.use("*", apiKeyAuth());


// Mount CMS routes
app.route("/api/cms", cmsRoutes);

Bun.serve({
  fetch: app.fetch,
  port: 8000,
});

console.log(`Server is running on port ${8000}`);