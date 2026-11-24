import nodemailer from "nodemailer";
import {
  renderOtpEmail,
  renderSecurityAlertEmail,
  renderShareInviteEmail,
  renderCredentialsEmail,
} from "@/emails/templates";

export interface Mailer {
  sendOtp(
    to: string,
    data: {
      code: string;
      purpose: string;
      ip?: string;
      userAgent?: string;
      time?: string;
    }
  ): Promise<boolean>;

  sendSecurityAlert(
    to: string,
    data: {
      alertType: string;
      details: string;
      ip?: string;
      userAgent?: string;
      time?: string;
    }
  ): Promise<boolean>;

  sendShareInvite(
    to: string,
    data: {
      senderName: string;
      fileName: string;
      shareUrl: string;
      expiresAt?: string;
      requiresOtp?: boolean;
    }
  ): Promise<boolean>;

  sendAccountCredentials(
    to: string,
    data: {
      name: string;
      userId: string;
      email: string;
      password?: string;
      dateOfBirth?: string;
      signupMethod: "form" | "google";
    }
  ): Promise<boolean>;
}

class GmailMailer implements Mailer {
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromName: string;
  private readonly fromEmail: string;

  constructor() {
    this.fromName = process.env.MAIL_FROM_NAME || "Orbitr Security";
    this.fromEmail = process.env.GMAIL_USER || "security@orbitr.local";

    const user = process.env.GMAIL_USER?.trim();
    const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 10000,
        socketTimeout: 15000,
      });
    }
  }

  private async sendWithRetry(
    options: nodemailer.SendMailOptions,
    retries = 1
  ): Promise<boolean> {
    if (!this.transporter) {
      // In development or when credentials are not configured, log to server console
      console.log("\n================ [ORBITR DEV EMAIL NOTIFICATION] ================");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body (Text):\n${options.text}`);
      console.log("=================================================================\n");
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        ...options,
      });
      return true;
    } catch (err) {
      console.error("[Mailer Error]", err);
      if (retries > 0) {
        console.warn("[Mailer] Retrying email delivery once in 1s...");
        await new Promise((res) => setTimeout(res, 1000));
        return this.sendWithRetry(options, retries - 1);
      }
      return false;
    }
  }

  async sendOtp(
    to: string,
    data: {
      code: string;
      purpose: string;
      ip?: string;
      userAgent?: string;
      time?: string;
    }
  ): Promise<boolean> {
    const purposeLabels: Record<string, string> = {
      signup: "Account Registration",
      login_new_device: "New Device Sign-in",
      password_reset: "Password Reset",
      share_access: "Protected File Access",
      sensitive_action: "Sensitive Security Confirmation",
    };

    const purposeLabel = purposeLabels[data.purpose] || "Verification";
    const { html, text } = renderOtpEmail({
      code: data.code,
      purposeLabel,
      device: data.userAgent,
      ip: data.ip,
      time: data.time,
    });

    return this.sendWithRetry({
      to,
      subject: `Orbitr Security Code: ${data.code} (${purposeLabel})`,
      text,
      html,
    });
  }

  async sendSecurityAlert(
    to: string,
    data: {
      alertType: string;
      details: string;
      ip?: string;
      userAgent?: string;
      time?: string;
    }
  ): Promise<boolean> {
    const { html, text } = renderSecurityAlertEmail({
      title: data.alertType,
      details: data.details,
      device: data.userAgent,
      ip: data.ip,
      time: data.time,
    });

    return this.sendWithRetry({
      to,
      subject: `Security Alert: ${data.alertType} - Orbitr`,
      text,
      html,
    });
  }

  async sendShareInvite(
    to: string,
    data: {
      senderName: string;
      fileName: string;
      shareUrl: string;
      expiresAt?: string;
      requiresOtp?: boolean;
    }
  ): Promise<boolean> {
    const { html, text } = renderShareInviteEmail(data);

    return this.sendWithRetry({
      to,
      subject: `${data.senderName} shared "${data.fileName}" with you on Orbitr`,
      text,
      html,
    });
  }

  async sendAccountCredentials(
    to: string,
    data: {
      name: string;
      userId: string;
      email: string;
      password?: string;
      dateOfBirth?: string;
      signupMethod: "form" | "google";
    }
  ): Promise<boolean> {
    const { html, text } = renderCredentialsEmail(data);

    return this.sendWithRetry({
      to,
      subject: `Your Orbitr Account Credentials (${data.userId})`,
      text,
      html,
    });
  }
}

export const mailer: Mailer = new GmailMailer();
