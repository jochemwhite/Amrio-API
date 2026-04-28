import type { Tables } from "../types/supabase";

export type NotificationSkipReason =
  | "notifications-disabled"
  | "preferences-not-found"
  | "missing-recipient";

export type FormNotificationResult =
  | { status: "sent"; recipient: string; messageId: string }
  | {
      status: "skipped";
      reason: NotificationSkipReason;
    };

type NotificationPreference = Pick<
  Tables<"form_notification_preferences">,
  "notify_email" | "notify_email_address"
>;

export type RecipientResolution =
  | { status: "resolved"; recipient: string }
  | { status: "skipped"; reason: NotificationSkipReason };

export function resolveRecipientFromPreference(
  preference: NotificationPreference | null,
  ownerEmail: string | null
): RecipientResolution {
  if (!preference) {
    return { status: "skipped", reason: "preferences-not-found" };
  }

  if (!preference.notify_email) {
    return { status: "skipped", reason: "notifications-disabled" };
  }

  if (preference.notify_email_address) {
    return { status: "resolved", recipient: preference.notify_email_address };
  }

  if (!ownerEmail) {
    return { status: "skipped", reason: "missing-recipient" };
  }

  return { status: "resolved", recipient: ownerEmail };
}
