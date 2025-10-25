// middleware/security/tenants.ts
import { Context, Next } from "hono";
import { supabase } from "../../lib/supabase";
import { logSecurityEvent } from "./utils";

/**
 * Tenant Isolation Validation Middleware
 *
 * Ensures that API keys can only access resources belonging to their tenant.
 * Prevents cross-tenant data access and enforces proper isolation.
 */
export function validateTenantAccess() {
  return async (c: Context, next: Next) => {
    const keyData = c.get("apiKey");

    if (!keyData) {
      await next();
      return;
    }

    // Extract resource IDs from URL
    const websiteId = c.req.param("websiteId");
    const pageId = c.req.param("pageId");
    const collectionId = c.req.param("collectionId");

    // Verify website belongs to tenant
    if (websiteId) {
      const { data: website, error } = await supabase.from("cms_websites").select("id, tenant_id").eq("id", websiteId).single();

      if (error || !website || website.tenant_id !== keyData.tenant_id) {
        await logSecurityEvent("cross_tenant_access_attempt", {
          api_key_id: keyData.id,
          key_tenant_id: keyData.tenant_id,
          requested_website_id: websiteId,
          actual_tenant_id: website?.tenant_id,
        });

        return c.json(
          {
            error: "Resource not found",
            message: "The requested resource does not exist or you do not have access to it.",
          },
          404
        );
      }

      // If key is scoped to specific website, verify match
      if (keyData.website_id && keyData.website_id !== websiteId) {
        return c.json(
          {
            error: "Access denied",
            message: "This API key is not authorized for this website.",
          },
          403
        );
      }
    }

    await next();
  };
}
