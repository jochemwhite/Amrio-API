import * as nodemailer from "nodemailer";
import { env } from "../lib/env";
import { supabase } from "../lib/supabase";
import type { Tables } from "../types/supabase";
import {
  resolveRecipientFromPreference,
  type FormNotificationResult,
  type RecipientResolution,
} from "./formNotificationLogic";

type SendFormSubmissionNotificationInput = {
  formId: string;
  submissionId: string;
  createdAt: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
};

type FormForNotification = Pick<
  Tables<"cms_forms">,
  "id" | "name" | "content" | "created_by"
>;

type NotificationPreference = Pick<
  Tables<"form_notification_preferences">,
  "notify_email" | "notify_email_address"
>;
type FormFieldDefinition = { key: string; label: string };

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "string") return value.trim() === "" ? "(empty)" : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseFormFieldsFromContent(content: unknown): FormFieldDefinition[] {
  if (Array.isArray(content)) {
    return content as FormFieldDefinition[];
  }

  if (content && typeof content === "object" && "content" in content) {
    const nested = (content as { content: unknown }).content;

    if (Array.isArray(nested)) {
      return nested as FormFieldDefinition[];
    }
  }

  return [];
}

function formatFromHeader(): string {
  if (env.SMTP_FROM_NAME) {
    return `${env.SMTP_FROM_NAME} <${env.SMTP_FROM_EMAIL}>`;
  }

  return env.SMTP_FROM_EMAIL;
}

function buildEmailTemplate(params: {
  formName: string;
  submissionId: string;
  createdAt: string;
  contentRows: Array<{ label: string; value: string }>;
  metadataRows: Array<{ label: string; value: string }>;
}) {
  const submittedAt = new Date(params.createdAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const htmlContentRows = params.contentRows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;vertical-align:top;width:35%;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;white-space:pre-wrap;word-break:break-word;">${escapeHtml(row.value)}</td>
        </tr>
      `
    )
    .join("");

  const htmlMetadataRows =
    params.metadataRows.length > 0
      ? `
      <h3 style="margin:24px 0 10px;color:#111827;font-size:16px;">Submission metadata</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tbody>${params.metadataRows
          .map(
            (row) => `
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;vertical-align:top;width:35%;">${escapeHtml(row.label)}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;white-space:pre-wrap;word-break:break-word;">${escapeHtml(row.value)}</td>
              </tr>
            `
          )
          .join("")}</tbody>
      </table>`
      : "";

  const html = `
    <div style="background:#f9fafb;padding:24px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
        <h2 style="margin:0 0 8px;color:#111827;">New form submission</h2>
        <p style="margin:0 0 4px;color:#4b5563;"><strong>Form:</strong> ${escapeHtml(params.formName)}</p>
        <p style="margin:0 0 4px;color:#4b5563;"><strong>Submission ID:</strong> ${escapeHtml(params.submissionId)}</p>
        <p style="margin:0 0 20px;color:#4b5563;"><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>

        <h3 style="margin:0 0 10px;color:#111827;font-size:16px;">Submitted fields</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <tbody>${htmlContentRows}</tbody>
        </table>

        ${htmlMetadataRows}
      </div>
    </div>
  `;

  const textFields = params.contentRows
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");

  const textMetadata =
    params.metadataRows.length > 0
      ? `\n\nSubmission metadata:\n${params.metadataRows
          .map((row) => `${row.label}: ${row.value}`)
          .join("\n")}`
      : "";

  const text = `New form submission
Form: ${params.formName}
Submission ID: ${params.submissionId}
Submitted: ${submittedAt}

Submitted fields:
${textFields}${textMetadata}
`;

  return { html, text };
}

async function getFormAndRecipient(formId: string): Promise<{
  form: FormForNotification;
  resolution: RecipientResolution;
}> {
  const { data: form, error: formError } = await supabase
    .from("cms_forms")
    .select("id, name, content, created_by")
    .eq("id", formId)
    .maybeSingle();

  if (formError) throw formError;
  if (!form) throw new Error(`Form ${formId} not found when sending notification`);

  const { data: preference, error: preferenceError } = await supabase
    .from("form_notification_preferences")
    .select("notify_email, notify_email_address")
    .eq("form_id", formId)
    .eq("user_id", form.created_by)
    .maybeSingle();

  if (preferenceError) throw preferenceError;
  if (!preference || !preference.notify_email || preference.notify_email_address) {
    return { form, resolution: resolveRecipientFromPreference(preference, null) };
  }

  const { data: owner, error: userError } = await supabase
    .from("users")
    .select("email")
    .eq("id", form.created_by)
    .maybeSingle();

  if (userError) throw userError;

  return {
    form,
    resolution: resolveRecipientFromPreference(preference, owner?.email ?? null),
  };
}

export async function sendFormSubmissionNotification(
  input: SendFormSubmissionNotificationInput
): Promise<FormNotificationResult> {
  const { form, resolution } = await getFormAndRecipient(input.formId);

  if (resolution.status === "skipped") {
    return { status: "skipped", reason: resolution.reason };
  }

  const fieldDefinitions = parseFormFieldsFromContent(form.content);
  const labelsByKey = new Map(fieldDefinitions.map((field) => [field.key, field.label]));

  const contentRows = Object.entries(input.content).map(([key, value]) => ({
    label: labelsByKey.get(key) ?? key,
    value: toDisplayValue(value),
  }));

  const metadataRows = Object.entries(input.metadata ?? {}).map(([key, value]) => ({
    label: key,
    value: toDisplayValue(value),
  }));

  const { html, text } = buildEmailTemplate({
    formName: form.name,
    submissionId: input.submissionId,
    createdAt: input.createdAt,
    contentRows,
    metadataRows,
  });

  const result = await transporter.sendMail({
    from: formatFromHeader(),
    to: resolution.recipient,
    subject: `New form submission: ${form.name}`,
    html,
    text,
  });

  return { status: "sent", recipient: resolution.recipient, messageId: result.messageId };
}
