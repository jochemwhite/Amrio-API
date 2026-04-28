import { supabase } from "../lib/supabase";
import type { Json, Tables } from "../types/supabase";
import { sendFormSubmissionNotification } from "./formNotifications";

type CmsForm = Tables<"cms_forms">;

export const formService = {
  async getFormById(formId: string): Promise<CmsForm | null> {
    const { data, error } = await supabase
      .from("cms_forms")
      .select("*")
      .eq("id", formId)
      .eq("published", true)
      .is("archived_at", null)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async submitForm(
    formId: string,
    content: Record<string, unknown>,
    metadata?: Record<string, unknown> | null,
  ) {
    const { data, error } = await supabase
      .from("cms_form_submissions")
      .insert({
        form_id: formId,
        content: content as unknown as Json,
        metadata: (metadata ?? null) as Json | null,
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    try {
      const notificationResult = await sendFormSubmissionNotification({
        formId,
        submissionId: data.id,
        createdAt: data.created_at,
        content,
        metadata,
      });

      if (notificationResult.status === "skipped") {
        console.info("Form notification skipped", {
          formId,
          submissionId: data.id,
          reason: notificationResult.reason,
        });
      }
    } catch (notificationError) {
      console.error("Failed to send form submission notification", {
        formId,
        submissionId: data.id,
        error: notificationError,
      });
    }

    const { data: form } = await supabase
      .from("cms_forms")
      .select("submissions")
      .eq("id", formId)
      .single();

    if (form) {
      await supabase
        .from("cms_forms")
        .update({ submissions: form.submissions + 1 })
        .eq("id", formId);
    }

    return data;
  },
};
