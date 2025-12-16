import nodemailer from "nodemailer";

// Generate numeric OTP
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

    const subject = "Confirm Your Sign Up";
      
    const text = `Welcome! Your OTP to confirm your sign up is: ${otp}. It expires in 5 minutes.`;
     
    const html = `<p>Welcome! Your OTP to confirm your sign up is: <b>${otp}</b></p><p>It expires in 5 minutes.</p>`;

    const info = await transporter.sendMail({
      from: `"CodeMania" <maniacode08@gmail.com>`,
      to: toEmail,
      subject,
      text,
      html
    });

    console.log("OTP sent:", info.messageId);

  } catch (err) {
    console.error("sendOtpEmail failed:", err);
    throw new Error("Unable to send OTP");
  }
}


