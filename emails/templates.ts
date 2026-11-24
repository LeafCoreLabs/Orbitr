export interface OtpEmailProps {
  code: string;
  purposeLabel: string;
  device?: string;
  ip?: string;
  time?: string;
}

export function renderOtpEmail({
  code,
  purposeLabel,
  device = "Unknown Browser / Device",
  ip = "Unknown IP",
  time = new Date().toUTCString(),
}: OtpEmailProps) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Vaulta Security Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0e14; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0c0e14; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #161922; border: 1px solid #232838; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #232838; background: linear-gradient(180deg, #1d2232 0%, #161922 100%);">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ORBITR</span>
              </div>
              <p style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Security Verification</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #f8fafc; text-align: center;">Verify your identity</h1>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Use the one-time security code below to complete your <strong style="color: #cbd5e1;">${purposeLabel}</strong> request.
              </p>

              <!-- Code Box -->
              <div style="background-color: #0f121a; border: 1px solid #2f374e; border-radius: 12px; padding: 24px 16px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 700; letter-spacing: 8px; color: #38bdf8; display: inline-block;">
                  ${code}
                </span>
                <p style="margin: 12px 0 0; font-size: 12px; color: #64748b; font-weight: 500;">
                  Valid for 10 minutes &bull; Single-use only
                </p>
              </div>

              <!-- Metadata / Audit Info -->
              <div style="background-color: #12151e; border: 1px solid #1e2433; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px; color: #64748b; line-height: 1.6;">
                <div style="margin-bottom: 4px;"><strong style="color: #94a3b8;">Requested from:</strong> ${device}</div>
                <div style="margin-bottom: 4px;"><strong style="color: #94a3b8;">IP Address:</strong> ${ip}</div>
                <div><strong style="color: #94a3b8;">Timestamp:</strong> ${time}</div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
                If you did not request this verification code, please ignore this email or review your account security immediately. Never share your security code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f121a; border-top: 1px solid #1e2433; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; ${new Date().getFullYear()} Orbitr. Your files, in orbit.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
VAULTA - Security Verification

Your one-time verification code for ${purposeLabel}:
${code}

This code is valid for 10 minutes and can only be used once.

Request details:
- Device: ${device}
- IP Address: ${ip}
- Time: ${time}

If you did not make this request, please safely disregard this message.
Orbitr - Your files, in orbit.
  `.trim();

  return { html, text };
}

export function renderSecurityAlertEmail({
  title,
  details,
  device = "Unknown Device",
  ip = "Unknown IP",
  time = new Date().toUTCString(),
}: {
  title: string;
  details: string;
  device?: string;
  ip?: string;
  time?: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vaulta Security Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0e14; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #161922; border: 1px solid #ef444440; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #232838; background: #261616;">
              <h2 style="margin: 0; font-size: 20px; color: #f87171;">SECURITY ALERT</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h3 style="margin: 0 0 16px; color: #f1f5f9;">${title}</h3>
              <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">${details}</p>
              <div style="background-color: #12151e; border: 1px solid #1e2433; border-radius: 8px; padding: 14px; font-size: 12px; color: #94a3b8;">
                <div><strong>Device:</strong> ${device}</div>
                <div><strong>IP:</strong> ${ip}</div>
                <div><strong>Time:</strong> ${time}</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
VAULTA - SECURITY ALERT: ${title}

${details}

Details:
- Device: ${device}
- IP: ${ip}
- Time: ${time}
  `.trim();

  return { html, text };
}

export function renderShareInviteEmail({
  senderName,
  fileName,
  shareUrl,
  expiresAt,
  requiresOtp,
}: {
  senderName: string;
  fileName: string;
  shareUrl: string;
  expiresAt?: string;
  requiresOtp?: boolean;
}) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>File Shared with You on Vaulta</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0e14; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #161922; border: 1px solid #232838; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 32px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 20px; color: #f1f5f9;">Secure File Transfer</h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8;">
                <strong style="color: #cbd5e1;">${senderName}</strong> has shared a file with you via Vaulta.
              </p>
              <div style="background-color: #0f121a; border: 1px solid #2f374e; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
                <div style="font-size: 16px; font-weight: 600; color: #38bdf8; word-break: break-all;">${fileName}</div>
                ${expiresAt ? `<div style="font-size: 12px; color: #64748b; margin-top: 6px;">Expires: ${expiresAt}</div>` : ""}
                ${requiresOtp ? `<div style="font-size: 12px; color: #eab308; margin-top: 4px;">&#9888; Identity verification required upon opening</div>` : ""}
              </div>
              <a href="${shareUrl}" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Access Secure File
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
VAULTA - Secure File Shared

${senderName} shared "${fileName}" with you.
Access link: ${shareUrl}
${expiresAt ? `Expires: ${expiresAt}` : ""}
${requiresOtp ? `Note: You will be asked to verify your email with an OTP before viewing.` : ""}
  `.trim();

  return { html, text };
}

export function renderCredentialsEmail({
  name,
  userId,
  email,
  password,
  dateOfBirth,
  signupMethod,
}: {
  name: string;
  userId: string;
  email: string;
  password?: string;
  dateOfBirth?: string;
  signupMethod: "form" | "google";
}) {
  const methodBadge = signupMethod === "google" ? "Google OAuth" : "Direct Registration";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Vaulta - Your Account Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0e14; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0c0e14; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #161922; border: 1px solid #232838; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #232838; background: linear-gradient(180deg, #1d2232 0%, #161922 100%);">
              <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ORBITR</span>
              <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Welcome to Your Personal Cloud</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #f8fafc; text-align: center;">Account Created Successfully</h1>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Hello <strong style="color: #cbd5e1;">${name}</strong>, your Vaulta drive is ready. Here are your account credentials and details:
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #0f121a; border: 1px solid #2f374e; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; width: 35%;"><strong>User ID:</strong></td>
                    <td style="padding: 8px 0; color: #38bdf8; font-family: monospace; font-weight: 700; font-size: 15px;">${userId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Email Address:</strong></td>
                    <td style="padding: 8px 0; color: #f1f5f9;">${email}</td>
                  </tr>
                  ${password ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Password:</strong></td>
                    <td style="padding: 8px 0;">
                      <span style="font-family: monospace; font-size: 15px; font-weight: 700; color: #a5b4fc; background-color: #1e1b4b; padding: 4px 10px; border-radius: 6px; border: 1px solid #3730a3; display: inline-block;">
                        ${password}
                      </span>
                    </td>
                  </tr>
                  ` : ""}
                  ${dateOfBirth ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Date of Birth:</strong></td>
                    <td style="padding: 8px 0; color: #cbd5e1;">${dateOfBirth}</td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Signup Method:</strong></td>
                    <td style="padding: 8px 0; color: #10b981;">${methodBadge}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Storage Quota:</strong></td>
                    <td style="padding: 8px 0; color: #f1f5f9;">2.0 GB (Encrypted)</td>
                  </tr>
                </table>
              </div>

              <!-- Security Tips -->
              <div style="background-color: #12151e; border: 1px solid #1e2433; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                <div style="margin-bottom: 4px;"><strong style="color: #38bdf8;">Login Flexibility:</strong> You can sign in using either your <strong>Email</strong> or your <strong>User ID (${userId})</strong>.</div>
                <div><strong style="color: #10b981;">Passkeys:</strong> You can also link Touch ID / Face ID / Windows Hello under Security Settings for fast, passwordless login.</div>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.APP_URL || "http://localhost:3000"}/login" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
                  Sign In to Vaulta Drive
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f121a; border-top: 1px solid #1e2433; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; ${new Date().getFullYear()} Orbitr. Your files, in orbit.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
VAULTA - Account Registration

Hello ${name}, your Vaulta personal cloud drive is ready.

Your Account Credentials:
- User ID: ${userId}
- Email: ${email}
${password ? `- Password: ${password}` : ""}
${dateOfBirth ? `- Date of Birth: ${dateOfBirth}` : ""}
- Signup Method: ${methodBadge}
- Quota: 2.0 GB Encrypted Storage

Access your drive: ${process.env.APP_URL || "http://localhost:3000"}/login

Orbitr - Your files, in orbit.
  `.trim();

  return { html, text };
}
