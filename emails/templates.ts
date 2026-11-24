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
  <title>Your Orbitr Security Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d12; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0d12; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #15171c; border: 1px solid #262a34; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.7);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #262a34; background: linear-gradient(180deg, #1c1f26 0%, #15171c 100%);">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <span style="color: #a78bfa;">Or</span><span style="color: #ffffff;">bitr</span>
                </span>
              </div>
              <p style="margin: 0; font-size: 11px; color: #818cf8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Security Verification</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #f8fafc; text-align: center;">Verify your identity</h1>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Use the one-time authentication code below to complete your <strong style="color: #e2e8f0;">${purposeLabel}</strong> request.
              </p>

              <!-- Code Box -->
              <div style="background-color: #0d0f14; border: 1px solid #2a3142; border-radius: 14px; padding: 26px 16px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);">
                <span style="font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #a78bfa; display: inline-block;">
                  ${code}
                </span>
                <p style="margin: 12px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">
                  Valid for 10 minutes &bull; Single-use only
                </p>
              </div>

              <!-- Metadata / Audit Info -->
              <div style="background-color: #12151c; border: 1px solid #1f2430; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 12px; color: #64748b; line-height: 1.7;">
                <div style="margin-bottom: 4px;"><strong style="color: #94a3b8;">Requested from:</strong> <span style="color: #cbd5e1;">${device}</span></div>
                <div style="margin-bottom: 4px;"><strong style="color: #94a3b8;">IP Address:</strong> <span style="color: #cbd5e1;">${ip}</span></div>
                <div><strong style="color: #94a3b8;">Timestamp:</strong> <span style="color: #cbd5e1;">${time}</span></div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
                If you did not request this security code, please safely ignore this message. Your files remain protected by zero-knowledge encryption.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f1217; border-top: 1px solid #1f2430; text-align: center;">
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
ORBITR - Security Verification

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
  <title>Orbitr Security Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d12; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #15171c; border: 1px solid #ef444440; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.7);">
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #262a34; background: #221518;">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                  <span style="color: #a78bfa;">Or</span><span style="color: #ffffff;">bitr</span>
                </span>
              </div>
              <h2 style="margin: 0; font-size: 14px; color: #f87171; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">Security Alert</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h3 style="margin: 0 0 16px; color: #f1f5f9; font-size: 18px;">${title}</h3>
              <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.6;">${details}</p>
              <div style="background-color: #12151c; border: 1px solid #1f2430; border-radius: 8px; padding: 14px; font-size: 12px; color: #94a3b8; line-height: 1.7;">
                <div><strong style="color: #cbd5e1;">Device:</strong> ${device}</div>
                <div><strong style="color: #cbd5e1;">IP Address:</strong> ${ip}</div>
                <div><strong style="color: #cbd5e1;">Timestamp:</strong> ${time}</div>
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.APP_URL || "https://orbitr-theta.vercel.app"}/security" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px;">
                  Review Security Center
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 32px; background-color: #0f1217; border-top: 1px solid #1f2430; text-align: center;">
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
ORBITR - SECURITY ALERT: ${title}

${details}

Details:
- Device: ${device}
- IP: ${ip}
- Time: ${time}

Manage devices: ${process.env.APP_URL || "https://orbitr-theta.vercel.app"}/security
Orbitr - Your files, in orbit.
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
  <title>File Shared with You on Orbitr</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d12; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #15171c; border: 1px solid #262a34; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.7);">
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #262a34; background: linear-gradient(180deg, #1c1f26 0%, #15171c 100%);">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                  <span style="color: #a78bfa;">Or</span><span style="color: #ffffff;">bitr</span>
                </span>
              </div>
              <p style="margin: 0; font-size: 11px; color: #818cf8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Zero-Knowledge File Transfer</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #f1f5f9;">Secure File Transfer</h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                <strong style="color: #e2e8f0;">${senderName}</strong> has shared an encrypted file with you via Orbitr.
              </p>
              <div style="background-color: #0d0f14; border: 1px solid #2a3142; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);">
                <div style="font-size: 16px; font-weight: 700; color: #a78bfa; word-break: break-all;">${fileName}</div>
                ${expiresAt ? `<div style="font-size: 12px; color: #64748b; margin-top: 6px;">Expires: ${expiresAt}</div>` : ""}
                ${requiresOtp ? `<div style="font-size: 12px; color: #fbbf24; margin-top: 6px;">&#9888; Recipient email OTP verification required upon opening</div>` : ""}
              </div>
              <a href="${shareUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 18px rgba(99, 102, 241, 0.45);">
                Access Secure File &rarr;
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 32px; background-color: #0f1217; border-top: 1px solid #1f2430; text-align: center;">
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
ORBITR - Secure File Shared

${senderName} shared "${fileName}" with you.
Access link: ${shareUrl}
${expiresAt ? `Expires: ${expiresAt}` : ""}
${requiresOtp ? `Note: You will be asked to verify your email with an OTP before viewing.` : ""}

Orbitr - Your files, in orbit.
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
  <title>Welcome to Orbitr - Your Account Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d12; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0d12; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #15171c; border: 1px solid #262a34; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.7);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #262a34; background: linear-gradient(180deg, #1c1f26 0%, #15171c 100%);">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                  <span style="color: #a78bfa;">Or</span><span style="color: #ffffff;">bitr</span>
                </span>
              </div>
              <p style="margin: 0; font-size: 11px; color: #818cf8; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Zero-Knowledge Personal Cloud</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #f8fafc; text-align: center;">Account Created Successfully</h1>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Hello <strong style="color: #e2e8f0;">${name}</strong>, your Orbitr personal cloud drive is ready. Here are your account credentials and details:
              </p>

              <!-- Credentials Box -->
              <div style="background-color: #0d0f14; border: 1px solid #2a3142; border-radius: 12px; padding: 22px; margin-bottom: 24px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8; width: 35%;"><strong>User ID:</strong></td>
                    <td style="padding: 8px 0; color: #a78bfa; font-family: monospace; font-weight: 700; font-size: 15px;">${userId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Email Address:</strong></td>
                    <td style="padding: 8px 0; color: #f1f5f9;">${email}</td>
                  </tr>
                  ${password ? `
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Password:</strong></td>
                    <td style="padding: 8px 0;">
                      <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #c7d2fe; background-color: #1e1b4b; padding: 4px 10px; border-radius: 6px; border: 1px solid #4338ca; display: inline-block;">
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
                    <td style="padding: 8px 0; color: #10b981; font-weight: 600;">${methodBadge}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;"><strong>Storage Quota:</strong></td>
                    <td style="padding: 8px 0; color: #f1f5f9;">2.0 GB (Encrypted)</td>
                  </tr>
                </table>
              </div>

              <!-- Security Tips -->
              <div style="background-color: #12151c; border: 1px solid #1f2430; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                <div style="margin-bottom: 6px;"><strong style="color: #a78bfa;">Login Flexibility:</strong> You can sign in using either your <strong>Email</strong> or your <strong>User ID (${userId})</strong>.</div>
                <div><strong style="color: #10b981;">Passkeys:</strong> You can also link Touch ID / Face ID / Windows Hello under Security Settings for fast, biometric passwordless login.</div>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.APP_URL || "https://orbitr-theta.vercel.app"}/login" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); color: #ffffff; padding: 14px 34px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 18px rgba(99, 102, 241, 0.45);">
                  Sign In to Orbitr Drive &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f1217; border-top: 1px solid #1f2430; text-align: center;">
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
ORBITR - Account Registration

Hello ${name}, your Orbitr personal cloud drive is ready.

Your Account Credentials:
- User ID: ${userId}
- Email: ${email}
${password ? `- Password: ${password}` : ""}
${dateOfBirth ? `- Date of Birth: ${dateOfBirth}` : ""}
- Signup Method: ${methodBadge}
- Quota: 2.0 GB Encrypted Storage

Access your drive: ${process.env.APP_URL || "https://orbitr-theta.vercel.app"}/login

Orbitr - Your files, in orbit.
  `.trim();

  return { html, text };
}
