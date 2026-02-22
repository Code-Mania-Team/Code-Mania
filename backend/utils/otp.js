import path from "path";

const crownPath = path.resolve(process.cwd(), "public", "crown.png");

console.log("brevo credentials:", process.env.BREVO_USER, process.env.BREVO_PASS);

/**
 * Generate numeric OTP
 */
export function generateOtp(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

/**
 * Shared branded layout (EMAIL-SAFE)
 */
function baseLayout({ title, subtitle, otp, warningBlock }) {
  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#121212;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#0b0b0b;border-radius:12px;overflow:hidden;">
            
            <!-- HEADER -->
            <tr>
              <td style="background:linear-gradient(135deg,#1e3a5f,#0f1f3d);padding:30px;text-align:center;">
                <img src="cid:crown" width="36" style="vertical-align:middle;margin-right:10px;" />
                <span style="color:#ffd700;font-size:26px;font-weight:bold;letter-spacing:3px;">
                  CODE MANIA
                </span>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:40px;text-align:center;color:#ffffff;font-family:Courier New, monospace;">
                <h1 style="margin-bottom:10px;">${title}</h1>
                <p style="color:#cccccc;">${subtitle}</p>

                <div style="margin:30px auto;padding:25px;background:#1a1a2e;
                            border-radius:12px;display:inline-block;
                            font-size:36px;font-weight:bold;letter-spacing:8px;">
                  ${otp}
                </div>

                <p style="color:#ff6b6b;margin-top:15px;">
                  ⏱️ This code expires in <strong>5 minutes</strong>
                </p>

                ${warningBlock || ""}

                <p style="margin-top:30px;font-size:13px;color:#999;">
                  Code Mania will never ask for your password or OTP.
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
}

/**
 * Signup email (BRANDED + FRIENDLY)
 */
function signupTemplate(otp) {
  return {
    subject: "Confirm Your Sign Up - Code Mania",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0d0d0d;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:50px 0;">
        
        <!-- CARD -->
        <table width="380" cellpadding="0" cellspacing="0"
               style="background:#000000;border-radius:18px;overflow:hidden;">
          
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:28px 0 22px;">
              <table cellpadding="0" cellspacing="0"
                     style="background:#1e3a5f;
                            border-radius:10px;
                            padding:10px 18px;">
                <tr>
                  <td>
                    <img src="cid:crown" width="22"
                         style="vertical-align:middle;margin-right:8px;" />
                  </td>
                  <td style="color:#ffd700;
                             font-family:Courier New, monospace;
                             font-size:18px;
                             letter-spacing:3px;
                             font-weight:bold;">
                    CODE MANIA
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td align="center"
                style="color:#ffffff;
                       font-family:Courier New, monospace;
                       font-size:20px;
                       letter-spacing:2px;
                       padding-bottom:12px;">
              VERIFY YOUR ACCOUNT
            </td>
          </tr>

          <!-- SUBTITLE -->
          <tr>
            <td align="center"
                style="color:#cfcfcf;
                       font-family:Courier New, monospace;
                       font-size:12px;
                       line-height:1.6;
                       padding:0 26px 26px;">
              Enter this One-Time Password (OTP) to complete your sign up:
            </td>
          </tr>

          <!-- OTP BOX -->
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0"
                     style="background:#14162b;
                            border:2px solid #6c63ff;
                            border-radius:12px;">
                <tr>
                  <td style="padding:18px 28px;
                             color:#ffffff;
                             font-family:Courier New, monospace;
                             font-size:28px;
                             letter-spacing:8px;
                             font-weight:bold;">
                    ${otp}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EXPIRY -->
          <tr>
            <td align="center"
                style="padding-top:14px;
                       color:#ff5a5a;
                       font-family:Courier New, monospace;
                       font-size:11px;">
              ⏱ This code will expire in 5 minutes
            </td>
          </tr>

          <!-- WARNING -->
          <tr>
            <td style="padding:26px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#ff9800;
                            border-radius:10px;">
                <tr>
                  <td style="padding:16px;
                             font-family:Courier New, monospace;
                             font-size:11px;
                             color:#000000;
                             line-height:1.6;">
                    ⚠ <strong>BE WARY OF HACKS</strong><br><br>
                    Your safety is our ultimate priority. Never share this OTP with anyone.
                    Code Mania will never ask for your password or OTP via email or phone.<br><br>
                    <strong>#TogetherWePlaySafe</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER TEXT -->
          <tr>
            <td align="center"
                style="color:#9a9a9a;
                       font-family:Courier New, monospace;
                       font-size:10px;
                       line-height:1.6;
                       padding:0 24px 24px;">
              If you didn’t request this code, please ignore this email or contact our support team immediately.
            </td>
          </tr>

          <!-- FOOTER BAR -->
          <tr>
            <td align="center"
                style="border-top:1px solid #222;
                       padding:14px;
                       color:#666;
                       font-family:Courier New, monospace;
                       font-size:9px;">
              © 2024 Code Mania. All rights reserved.<br>
              This is an automated message, please do not reply.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
  };
}



/**
 * Password reset email (SERIOUS + SECURITY)
 */
function resetTemplate(otp) {
  return {
    subject: "Reset Your Password - Code Mania",
    html: baseLayout({
      title: "PASSWORD RESET REQUEST",
      subtitle: "We received a request to reset your Code Mania password:",
      otp,
      warningBlock: `
        <div style="margin-top:25px;background:#2a0000;padding:18px;
                    border-radius:8px;color:#ffb3b3;text-align:left;">
          <strong>⚠️ Security Notice</strong>
          <p style="margin:8px 0 0;">
            If you did NOT request this, please ignore this email.
            Your account is still secure.
          </p>
        </div>
      `
    })
  };
}

/**
 * Send OTP email
 */
export async function sendOtpEmail({ toEmail, otp, type }) {
  let template;

  if (type === "signup") {
    template = signupTemplate(otp);
  } else if (type === "reset") {
    template = resetTemplate(otp);
  } else {
    throw new Error("Invalid OTP type");
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: "Code Mania",
          email: "maniacode08@gmail.com" // MUST be verified in Brevo
        },
        to: [
          {
            email: toEmail
          }
        ],
        subject: template.subject,
        htmlContent: template.html
      })
    });
    console.log("Brevo API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brevo API Error:", errorText);
      throw new Error("Failed to send email");
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return result;

  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Email service failed");
  }
}
