import { Hono } from "hono";
import { cors } from "hono/cors";
import { cmsRoutes } from "./routes/cms";
import { env } from "./lib/env";
import { rateLimit } from "./middleware/rateLimit";
import { apiKeyAuth } from "./middleware/auth";
import { securityMiddleware } from "./middleware/security";

const app = new Hono();

// ============================================
// SECURITY MIDDLEWARE (Applied in order)
// ============================================

// 1. Request ID for tracking (should be first)
app.use("*", securityMiddleware.requestId());

// 2. HTTPS enforcement (production only)
app.use("*", securityMiddleware.enforceHttps());

// 3. Security headers
app.use("*", securityMiddleware.securityHeaders());

// 4. Rate limiting
app.use("*", rateLimit());

// 5. API key authentication
app.use("*", apiKeyAuth());

// 6. Brute force protection (after auth, before routes)
app.use("*", securityMiddleware.bruteForceProtection());

// 7. IP whitelisting (if configured)
app.use("*", securityMiddleware.ipWhitelisting());

// 8. Origin whitelisting (CORS)
app.use("*", securityMiddleware.originWhitelisting());

// 9. Tenant isolation validation
app.use("*", securityMiddleware.validateTenantAccess());

// 10. Audit logging
app.use("*", securityMiddleware.auditApiKeyUsage());

// 11. Safe error handler (should be last)
app.use("*", securityMiddleware.safeErrorHandler());

// ============================================
// ROUTES
// ============================================

app.get("/", (c) => {
  return c.json({ message: "Amrio CMS API", version: "1.0.0" });
});


// Mount CMS routes
app.route("/api/cms", cmsRoutes);

Bun.serve({
  fetch: app.fetch,
  port: 8000,
});

console.log(`Server is running on port ${8000}`);