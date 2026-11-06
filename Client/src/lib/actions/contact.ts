"use server";

import nodemailer from "nodemailer";
import {
  IContactMessage,
  ApiResponse,
  TContactStatus,
} from "@/lib/api/contact";

import { getApiBaseUrl } from "@/lib/api/config";

const SUPPORT_EMAIL = process.env.EMAIL_FROM || process.env.SMTP_USER || "foodflow.support@gmail.com";

/**
 * Helper to create nodemailer transporter safely
 */
function getEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
}

/**
 * 1. Submit Contact Form (Saves to MongoDB and Sends Notification & Confirmation Emails)
 */
export async function submitContactForm(
  formData: ContactFormData,
): Promise<ApiResponse<IContactMessage>> {
  try {
    const ticketId = `FF-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Save into Backend Database
    let savedDoc: IContactMessage | undefined;
    try {
      const dbRes = await fetch(`${getApiBaseUrl()}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "",
          category: formData.category || "Other",
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (dbRes.ok) {
        const json = await dbRes.json();
        savedDoc = json.data;
      }
    } catch (dbErr) {
      console.warn(
        "Could not save contact message directly to backend:",
        dbErr,
      );
    }

    // 2. Send Emails via Nodemailer
    const transporter = getEmailTransporter();
    if (transporter) {
      const fromSender =
        process.env.EMAIL_FROM || `"Food Flow Support" <${SUPPORT_EMAIL}>`;

      // Email A: Send notification to foodflow.support@gmail.com
      const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Support Ticket #${ticketId}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F6;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#282C3F;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F2F6;padding:36px 12px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 12px 36px rgba(40,44,63,0.08);">
          <!-- Swiggy-themed Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #FC8019 0%, #FF5200 100%);padding:28px 32px;text-align:center;color:#ffffff;">
              <div style="display:inline-block;background:#ffffff;padding:8px 20px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.12);margin-bottom:14px;">
                <img src="https://i.ibb.co/jPhnCNFt/Food-Flow-Logo.png" alt="FoodFlow" width="130" style="display:block;max-width:130px;height:auto;" />
              </div>
              <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">New Support Ticket Received</h2>
              <div style="display:inline-block;margin-top:8px;background:rgba(255,255,255,0.22);border-radius:20px;padding:5px 16px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.5px;">
                TICKET #${ticketId} &bull; ${formData.category.toUpperCase()}
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <div style="background-color:#FFF7ED;border-left:4px solid #FC8019;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:11px;font-weight:800;color:#EA580C;text-transform:uppercase;letter-spacing:0.5px;">Subject</p>
                <p style="margin:4px 0 0 0;font-size:16px;color:#282C3F;font-weight:700;">${formData.subject}</p>
              </div>

              <table width="100%" cellpadding="8" cellspacing="0" style="font-size:13px;color:#475569;margin-bottom:24px;border:1px solid #F1F5F9;border-radius:12px;background:#FAFAFC;">
                <tr><td width="110" style="font-weight:700;color:#686B78;">Sender:</td><td style="font-weight:700;color:#282C3F;">${formData.name}</td></tr>
                <tr><td style="font-weight:700;color:#686B78;">Email:</td><td><a href="mailto:${formData.email}" style="color:#FC8019;text-decoration:none;font-weight:700;">${formData.email}</a></td></tr>
                ${formData.phone ? `<tr><td style="font-weight:700;color:#686B78;">Phone:</td><td style="font-weight:700;color:#282C3F;"><a href="tel:${formData.phone}" style="color:#282C3F;text-decoration:none;">${formData.phone}</a></td></tr>` : ""}
                <tr><td style="font-weight:700;color:#686B78;">Category:</td><td><span style="background:#E2E8F0;padding:3px 10px;border-radius:6px;font-weight:700;color:#0F172A;font-size:12px;">${formData.category}</span></td></tr>
                <tr><td style="font-weight:700;color:#686B78;">Timestamp:</td><td style="color:#686B78;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td></tr>
              </table>

              <div style="border-top:1px solid #E5E7EB;padding-top:20px;">
                <h4 style="margin:0 0 10px 0;color:#282C3F;font-size:14px;font-weight:800;letter-spacing:-0.2px;">Customer Inquiry Message:</h4>
                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:18px;font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap;font-family:inherit;">${formData.message}</div>
              </div>

              <div style="margin-top:28px;text-align:center;">
                <a href="mailto:${formData.email}?subject=Re: [Ticket %23${ticketId}] ${encodeURIComponent(formData.subject)}" style="display:inline-block;background:#FC8019;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 34px;border-radius:12px;box-shadow:0 6px 18px rgba(252,128,25,0.35);letter-spacing:0.3px;">Reply to Customer &rarr;</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#FAFAFC;padding:18px 32px;border-top:1px solid #E5E7EB;font-size:12px;color:#94A3B8;text-align:center;">
              FoodFlow Platform &bull; Customer Helpdesk &bull; Berhampur, Odisha
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Email B: Send confirmation receipt to the customer
      const userHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>We Received Your Request #${ticketId} — Food Flow Support</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #121214 !important; }
      .email-card { background-color: #1E1E24 !important; border-color: #2E2E36 !important; }
      .text-title { color: #FFFFFF !important; }
      .text-body { color: #CBD5E1 !important; }
      .info-box { background-color: #26262E !important; border-color: #383842 !important; }
      .info-label { color: #94A3B8 !important; }
      .info-val { color: #FFFFFF !important; }
      .quote-box { background-color: #2A2421 !important; border-color: #EA580C !important; color: #FED7AA !important; }
      .footer-bg { background-color: #18181C !important; border-color: #2A2A32 !important; color: #64748B !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F6;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#282C3F;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#F2F2F6;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" class="email-card" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 12px 36px rgba(40,44,63,0.08);">
          
          <!-- Swiggy-themed Brand Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #FC8019 0%, #FF5200 100%);padding:28px 24px;text-align:center;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Brand Logo Pill -->
                    <div style="display:inline-block;background:#ffffff;padding:8px 20px;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,0.12);margin-bottom:14px;">
                      <img src="https://i.ibb.co/jPhnCNFt/Food-Flow-Logo.png" alt="FoodFlow" width="130" style="display:block;max-width:130px;height:auto;" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">FoodFlow Customer Support</h1>
                    <p style="margin:6px 0 0 0;font-size:14px;color:#FFE8DB;font-weight:600;">We're on it! Your request is in expert hands.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ticket Banner Pill -->
          <tr>
            <td style="padding:16px 28px 0 28px;text-align:center;">
              <div style="display:inline-block;background:#FFF4ED;border:1px solid #FFD9C2;padding:6px 18px;border-radius:20px;">
                <span style="font-size:12px;font-weight:800;color:#EA580C;letter-spacing:0.5px;">TICKET ID:</span>
                <span style="font-size:13px;font-weight:900;color:#282C3F;margin-left:4px;">#${ticketId}</span>
                <span style="color:#CBD5E1;margin:0 6px;">&bull;</span>
                <span style="font-size:12px;font-weight:700;color:#0284C7;">● In Review</span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:24px 32px 16px 32px;">
              <p class="text-title" style="font-size:16px;margin:0 0 12px 0;color:#282C3F;font-weight:700;">
                Hello ${formData.name},
              </p>
              
              <p class="text-body" style="font-size:14px;color:#686B78;line-height:1.65;margin:0 0 20px 0;">
                Thank you for reaching out to <strong>FoodFlow Support</strong>. We have securely logged your request regarding <strong>"${formData.subject}"</strong>. Our dedicated care specialists are reviewing it right away.
              </p>

              <!-- Ticket Receipt Card -->
              <div class="info-box" style="background:#FAFAFC;border:1px solid #E5E7EB;border-left:4px solid #FC8019;border-radius:14px;padding:18px 20px;margin-bottom:22px;">
                <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;">
                  <tr>
                    <td class="info-label" width="115" style="font-weight:700;color:#686B78;">Ticket Number:</td>
                    <td class="info-val" style="font-weight:800;color:#FC8019;font-family:monospace;font-size:14px;">#${ticketId}</td>
                  </tr>
                  <tr>
                    <td class="info-label" style="font-weight:700;color:#686B78;">Category:</td>
                    <td class="info-val" style="color:#282C3F;font-weight:600;">${formData.category}</td>
                  </tr>
                  <tr>
                    <td class="info-label" style="font-weight:700;color:#686B78;">Status:</td>
                    <td>
                      <span style="display:inline-block;background:#E0F2FE;color:#0284C7;font-weight:800;font-size:11px;padding:3px 10px;border-radius:12px;letter-spacing:0.3px;">
                        UNDER REVIEW
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="info-label" style="font-weight:700;color:#686B78;">Avg Response:</td>
                    <td class="info-val" style="color:#16A34A;font-weight:700;">&lt; 15 Minutes</td>
                  </tr>
                </table>

                <!-- Inquiry snippet -->
                <div class="quote-box" style="margin-top:14px;padding:12px 14px;background:#FFF7ED;border-radius:8px;border:1px dashed #FDBA74;font-size:13px;color:#9A3412;line-height:1.5;">
                  <strong>Your Inquiry:</strong> "${formData.message}"
                </div>
              </div>

              <!-- Swiggy-style Call to Action -->
              <div style="text-align:center;margin:28px 0 20px 0;">
                <a href="http://localhost:3000/contact" style="display:inline-block;background:linear-gradient(135deg, #FC8019 0%, #FF5200 100%);color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 34px;border-radius:14px;box-shadow:0 6px 20px rgba(252,128,25,0.35);letter-spacing:0.3px;">
                  View Ticket & Support Center &rarr;
                </a>
                <div style="margin-top:12px;">
                  <a href="http://localhost:3000/dishes" style="color:#FC8019;text-decoration:none;font-weight:700;font-size:13px;">
                    Craving something tasty? Browse live restaurants &rarr;
                  </a>
                </div>
              </div>

              <!-- Assistance Note -->
              <div style="border-top:1px dashed #E5E7EB;padding-top:16px;margin-top:20px;">
                <p class="text-body" style="font-size:12px;color:#94A3B8;line-height:1.55;margin:0;">
                  &bull; <strong>Have more info?</strong> Simply reply directly to this email &mdash; your response will automatically attach to ticket <strong>#${ticketId}</strong>.<br/>
                  &bull; <strong>Live Urgent Support:</strong> You can also chat live with our FoodFlow AI Assistant 24/7 on the website.
                </p>
              </div>
            </td>
          </tr>

          <!-- Swiggy-Style Footer -->
          <tr>
            <td class="footer-bg" style="background:#FAFAFC;padding:24px 32px;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;color:#686B78;">
                Food Flow &bull; Fast, Fresh &amp; Delicious Delivery
              </p>
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                &copy; ${new Date().getFullYear()} Food Flow Platform &bull; Prem Nagar &amp; Odisha Food Hub &bull; Berhampur, Odisha<br/>
                Made with <span style="color:#EF4444;">&hearts;</span> for food lovers
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Dispatch Support Notification
      try {
        await transporter.sendMail({
          from: fromSender,
          to: SUPPORT_EMAIL,
          replyTo: `"${formData.name}" <${formData.email}>`,
          subject: `[Food Flow Support] [Ticket #${ticketId}] ${formData.subject} (${formData.category})`,
          html: adminHtml,
        });
      } catch (mailErr) {
        console.error("Error dispatching admin notification email:", mailErr);
      }

      // Dispatch Customer Confirmation
      try {
        await transporter.sendMail({
          from: fromSender,
          to: formData.email,
          replyTo: SUPPORT_EMAIL,
          subject: `We've received your request #${ticketId} — Food Flow Support`,
          html: userHtml,
        });
      } catch (userMailErr) {
        console.error(
          "Error dispatching user confirmation email:",
          userMailErr,
        );
      }
    }

    return {
      success: true,
      message: `Your inquiry has been submitted! Ticket ID: #${ticketId}`,
      data:
        savedDoc ||
        ({
          _id: ticketId,
          ticketId,
          name: formData.name,
          email: formData.email,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as IContactMessage),
    };
  } catch (err: any) {
    console.error("Error submitting contact form:", err);
    return {
      success: false,
      message:
        err.message || "Failed to submit your message. Please try again.",
    };
  }
}

/**
 * 2. Admin Replies to a Contact Message (Sends Email directly to Customer + Saves Reply in DB)
 */
export async function replyToContactMessageAction(payload: {
  messageId: string;
  toEmail: string;
  recipientName: string;
  ticketId: string;
  subject: string;
  replyText: string;
  adminName?: string;
  adminEmail?: string;
}): Promise<ApiResponse<IContactMessage>> {
  try {
    const {
      messageId,
      toEmail,
      recipientName,
      ticketId,
      subject,
      replyText,
      adminName = "Food Flow Support Team",
    } = payload;

    // 1. Send Email to Customer
    const transporter = getEmailTransporter();
    if (transporter) {
      const fromSender =
        process.env.EMAIL_FROM || `"Food Flow Support" <${SUPPORT_EMAIL}>`;

      const replyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Response to Support Ticket #${ticketId}</title></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 30px rgba(0,0,0,0.04);">
          <tr>
            <td style="background:linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);padding:24px 32px;color:#ffffff;">
              <h2 style="margin:0;font-size:20px;font-weight:800;">Food Flow Support Response</h2>
              <p style="margin:4px 0 0 0;font-size:13px;opacity:0.9;">Ticket #${ticketId}: ${subject}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="font-size:15px;margin:0 0 16px 0;color:#0F172A;">Hello <strong>${recipientName}</strong>,</p>
              
              <div style="background:#FFF7ED;border-left:4px solid #FF6B35;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#1E293B;white-space:pre-wrap;">${replyText}</p>
              </div>

              <div style="border-top:1px solid #F1F5F9;padding-top:16px;font-size:13px;color:#64748B;">
                <p style="margin:0 0 4px 0;">Best regards,</p>
                <p style="margin:0;font-weight:700;color:#0F172A;">${adminName}</p>
                <p style="margin:0;color:#FF6B35;font-weight:600;">Food Flow Customer Care</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#F8FAFC;padding:16px 32px;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;text-align:center;">
              Need more help? Simply reply to this email or visit our Help Center.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      try {
        await transporter.sendMail({
          from: fromSender,
          to: toEmail,
          replyTo: SUPPORT_EMAIL,
          subject: `Re: [Ticket #${ticketId}] ${subject}`,
          html: replyHtml,
        });
      } catch (mailErr) {
        console.error("Error sending reply email to customer:", mailErr);
      }
    }

    // 2. Record Reply in Server Database
    const res = await fetch(
      `${getApiBaseUrl()}/contacts/${encodeURIComponent(messageId)}/reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyMessage: replyText,
          repliedBy: adminName,
        }),
      },
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || "Failed to update reply record on server.",
      };
    }

    const data: ApiResponse<IContactMessage> = await res.json();
    return data;
  } catch (err: any) {
    console.error("Error sending contact reply:", err);
    return {
      success: false,
      message: err.message || "Failed to send reply.",
    };
  }
}

/**
 * 3. Update Contact Message Status
 */
export async function updateContactStatusAction(
  messageId: string,
  status: TContactStatus,
): Promise<ApiResponse<IContactMessage>> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/contacts/${encodeURIComponent(messageId)}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || "Failed to update status",
      };
    }

    return await res.json();
  } catch (err: any) {
    console.error("Error updating contact status:", err);
    return {
      success: false,
      message: err.message || "Failed to update status.",
    };
  }
}

/**
 * 4. Delete Contact Message
 */
export async function deleteContactMessageAction(
  messageId: string,
): Promise<ApiResponse<{ id: string }>> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/contacts/${encodeURIComponent(messageId)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || "Failed to delete message",
      };
    }

    return await res.json();
  } catch (err: any) {
    console.error("Error deleting contact message:", err);
    return {
      success: false,
      message: err.message || "Failed to delete message.",
    };
  }
}
