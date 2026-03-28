import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('FROM_EMAIL') || 'noreply@localhost';
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured - emails will be logged only');
      this.resend = null as unknown as Resend;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string,
  ): Promise<{ success: boolean; message: string }> {
    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:3010';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #4F46E5; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">AI Quiz</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1f2937;">
                Password Reset Request
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                Hi ${userName},
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4b5563;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link Alternative -->
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; color: #4F46E5; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <!-- Expiry Notice -->
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280; background-color: #fef3c7; padding: 12px; border-radius: 6px;">
                ⏰ This link expires in 1 hour for security reasons.
              </p>
              
              <!-- Security Notice -->
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                This is an automated email from AI Quiz. Please do not reply.
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

    // Log for development
    this.logger.log(`Password reset email would be sent to: ${to}`);
    this.logger.debug(`Reset URL: ${resetUrl}`);

    // Check if Resend is configured
    if (!this.resend) {
      this.logger.warn('Resend not configured - email logged only');
      return {
        success: true,
        message: 'Email service not configured. Reset link logged to console.',
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Reset Your AI Quiz Password',
        html: emailHtml,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`);
        return { success: false, message: error.message };
      }

      this.logger.log(`Password reset email sent successfully to ${to}, ID: ${data?.id}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(`Error sending email: ${error}`);
      return { success: false, message: 'Failed to send email' };
    }
  }
}
