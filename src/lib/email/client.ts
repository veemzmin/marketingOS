import { Resend } from "resend"

// Email client configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "console"
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@yourdomain.com"
const RESEND_API_KEY = process.env.RESEND_API_KEY || ""

// Initialize Resend client if using production mode
const resend = EMAIL_PROVIDER === "resend" ? new Resend(RESEND_API_KEY) : null

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using the configured provider.
 * In console mode (dev), logs email to terminal.
 * In resend mode (production), sends via Resend API.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (EMAIL_PROVIDER === "console") {
    // Development mode - log to console
    console.log("\n=== EMAIL SENT (CONSOLE MODE) ===")
    console.log(`To: ${options.to}`)
    console.log(`From: ${EMAIL_FROM}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`HTML Body:\n${options.html}`)
    if (options.text) {
      console.log(`Text Body:\n${options.text}`)
    }
    console.log("=================================\n")
    return
  }

  if (EMAIL_PROVIDER === "resend") {
    if (!resend) {
      throw new Error("Resend client not initialized. Check RESEND_API_KEY.")
    }

    // Production mode - send via Resend
    await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
    return
  }

  throw new Error(
    `Unknown EMAIL_PROVIDER: ${EMAIL_PROVIDER}. Use "console" or "resend".`
  )
}

/**
 * Send email verification link to user.
 * @param email User's email address
 * @param token Verification token
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`

  await sendEmail({
    to: email,
    subject: "Verify your email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for signing up! Please verify your email address by clicking the button below:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">Verify Email Address</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">${verificationUrl}</p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

            <p style="font-size: 13px; color: #999; margin: 0;">This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Thank you for signing up!

Please verify your email address by clicking the link below:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
    `.trim(),
  })
}
