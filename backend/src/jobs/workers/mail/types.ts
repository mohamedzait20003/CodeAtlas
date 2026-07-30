/** Serialised payload enqueued by any MailFactory and consumed by the mail worker. */
export interface EmailJobPayload {
  to: { email: string; name: string };
  subject: string;
  view: string;
  data: Record<string, unknown>;
}
