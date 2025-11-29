import nodemailer, { type Transporter } from "nodemailer";
import type { SendMailOptions } from "nodemailer";

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(email: string, otp: number) {
  try {
    const mailOptions: SendMailOptions = {
      from: `"Test Case Extension" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "🔐 Your Verification Code",
      text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
      html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); padding: 40px 20px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
        
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="background: #059669; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <h1 style="color: #065f46; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Test Case Extension</h1>
          <p style="color: #047857; font-size: 18px; margin: 10px 0 0 0; font-weight: 500;">Secure Verification</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); margin-bottom: 30px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1f2937; font-size: 28px; font-weight: 800; margin: 0 0 10px 0;">Welcome! 👋</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
              Use the following <strong>One Time Password (OTP)</strong> to complete your verification. 
              This code will expire in <strong style="color: #dc2626;">10 minutes</strong>.
            </p>
          </div>

          <!-- OTP Display -->
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; font-size: 36px; font-weight: 800; letter-spacing: 8px; padding: 20px 30px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.5); border: 3px solid rgba(255, 255, 255, 0.2);">
              ${otp}
            </div>
          </div>

          <!-- Security Notice -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <div style="display: flex; align-items: flex-start;">
              <div style="margin-right: 12px; margin-top: 2px;">
                <svg width="20" height="20" fill="#059669" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h3 style="color: #047857; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Security Tips</h3>
                <ul style="color: #065f46; font-size: 14px; margin: 0; padding-left: 16px; line-height: 1.5;">
                  <li>Never share this code with anyone</li>
                  <li>We will never ask for your OTP via phone or email</li>
                  <li>This code expires in 10 minutes</li>
                </ul>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Didn't request this code? Please ignore this email or 
              <a href="#" style="color: #059669; text-decoration: none; font-weight: 600;">contact support</a>.
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid rgba(5, 150, 105, 0.2); padding-top: 30px;">
          <p style="color: #047857; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
            Best regards,<br>
            The Test Case Extension Team
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Test Case Extension. All rights reserved.
          </p>
          <div style="margin-top: 20px;">
            <a href="#" style="color: #059669; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
            <span style="color: #d1d5db;">|</span>
            <a href="#" style="color: #059669; text-decoration: none; font-size: 12px; margin: 0 10px;">Terms of Service</a>
            <span style="color: #d1d5db;">|</span>
            <a href="#" style="color: #059669; text-decoration: none; font-size: 12px; margin: 0 10px;">Support</a>
          </div>
        </div>

      </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email: ", error);
    return { success: false, error };
  }
}
