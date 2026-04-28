import { describe, expect, it } from "bun:test";
import { resolveRecipientFromPreference } from "./formNotificationLogic";

describe("resolveRecipientFromPreference", () => {
  it("skips when preferences are missing", () => {
    const result = resolveRecipientFromPreference(null, "owner@acme.com");

    expect(result).toEqual({
      status: "skipped",
      reason: "preferences-not-found",
    });
  });

  it("skips when notifications are disabled", () => {
    const result = resolveRecipientFromPreference(
      { notify_email: false, notify_email_address: "ops@acme.com" },
      "owner@acme.com"
    );

    expect(result).toEqual({
      status: "skipped",
      reason: "notifications-disabled",
    });
  });

  it("uses explicit notification address first", () => {
    const result = resolveRecipientFromPreference(
      { notify_email: true, notify_email_address: "alerts@acme.com" },
      "owner@acme.com"
    );

    expect(result).toEqual({
      status: "resolved",
      recipient: "alerts@acme.com",
    });
  });

  it("falls back to owner email when no override is set", () => {
    const result = resolveRecipientFromPreference(
      { notify_email: true, notify_email_address: null },
      "owner@acme.com"
    );

    expect(result).toEqual({
      status: "resolved",
      recipient: "owner@acme.com",
    });
  });

  it("skips when override is missing and owner email is unavailable", () => {
    const result = resolveRecipientFromPreference(
      { notify_email: true, notify_email_address: null },
      null
    );

    expect(result).toEqual({
      status: "skipped",
      reason: "missing-recipient",
    });
  });
});
