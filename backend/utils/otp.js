import nodemailer from "nodemailer";
import path from "path";
// Generate numeric OTP

const crownPath = path.resolve(
  process.cwd(),
  "public",
  "crown.png"
);

export function generateOtp(length = 6) {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

// Send OTP email with dynamic message
export async function sendOtpEmail(toEmail, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
      }
    });

    const subject = "Confirm Your Sign Up - Code Mania";
      
    const text = `Welcome to Code Mania! Your OTP to confirm your sign up is: ${otp}. It expires in 5 minutes.`;
     
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code Mania - Verify Your Account</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Courier New', monospace;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #0a0a0a; border-radius: 8px; overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #0f1f3d; padding: 30px; text-align: center;">
                  <div style="display: inline-block;">
                    <img src="cid:crown" alt="Crown" style="width: 32px; height: 32px; vertical-align: middle; margin-right: 12px;" />
                    <span style="color: #e6e3d5ff; font-size: 28px; font-weight: bold; letter-spacing: 4px; vertical-align: middle;">CODE MANIA</span>
                  </div>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 50px 40px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">
                    VERIFY YOUR ACCOUNT
                  </h1>
                  
                  <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    Enter this One-Time Password (OTP) to complete your sign up:
                  </p>

                  <!-- OTP Display Box -->
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 4px; margin: 30px auto; max-width: 300px;">
                    <div style="background-color: #1a1a2e; border-radius: 10px; padding: 25px;">
                      <div style="color: #ffffff; font-size: 42px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </div>
                    </div>
                  </div>

                  <p style="color: #ff6b6b; font-size: 14px; margin: 20px 0;">
                    ⏱️ This code will expire in <strong>5 minutes</strong>
                  </p>

                  <!-- Security Warning Box -->
                  <div style="background-color: #ff8c00; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
                    <h3 style="color: #000000; font-size: 16px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase;">
                      ⚠️ Be Wary of Hacks
                    </h3>
                    <p style="color: #1a1a1a; font-size: 14px; line-height: 1.5; margin: 0;">
                      Your safety is our ultimate priority. Never share this OTP with anyone. Code Mania will never ask for your password or OTP via email or phone.
                    </p>
                    <p style="color: #1a1a1a; font-size: 13px; margin: 10px 0 0 0; font-weight: bold;">
                      #TogetherWePlaySafe
                    </p>
                  </div>

                  <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
                    If you didn't request this code, please ignore this email or contact our support team immediately.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333333;">
                  <p style="color: #666666; font-size: 12px; margin: 0; line-height: 1.5;">
                    © 2024 Code Mania. All rights reserved.<br>
                    This is an automated message, please do not reply to this email.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Code Mania" <maniacode08@gmail.com>`,
      to: toEmail,
      subject,
      text,
      html,
      attachments: [{
        filename: 'crown.png',
        path: crownPath, // Update this path to where your crown.png is located
        cid: 'crown' // Same cid value as in the html img src
      }]
    });

    console.log("OTP sent:", info.messageId);
    return info;
    
  } catch (err) {
    console.error("sendOtpEmail failed:", err);
    throw new Error("Unable to send OTP");
  }
}