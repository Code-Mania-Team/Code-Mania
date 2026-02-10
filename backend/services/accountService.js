import User from "../models/user.js";
import TempUser from "../models/tempUser.js";
import { encryptPassword } from "../utils/hash.js";
import { generateOtp, sendOtpEmail } from "../utils/otp.js";

class AccountService {
    constructor() {
        this.user = new User();
        this.tempUser = new TempUser();
    }

    async requestSignupOtp(email, password) {
        const existingUser = await this.user.findByEmail(email);
        if (existingUser) {
            throw new Error("email");
        }

        const otp = generateOtp();
        const hashedPassword = encryptPassword(password);
        const expiresAt = new Date(Date.now() + 60 * 1000);

        const record = await this.tempUser.upsertByEmail({
            email,
            password: hashedPassword,
            otp,
            expiry_time: expiresAt.toISOString(),
        });

        // await sendOtpEmail(email, otp);
        await sendOtpEmail({
            toEmail: email,
            otp,
            type: "signup"
        });
        return record;
    }

    async verifySignupOtp(email, otp) {
        const otpEntry = await this.tempUser.findByEmailAndOtp(email, otp);

        if (!otpEntry) throw new Error("OTP not found");
        if (otpEntry.is_verified) throw new Error("OTP already used");
        if (new Date(otpEntry.expiry_time) < new Date()) throw new Error("OTP expired");

        await this.tempUser.markVerified(otpEntry.temp_user_id);

        const newUser = await this.user.create({
            email: otpEntry.email,
            password: otpEntry.password,
            provider: null
        });

        return newUser;
    }

    async loginWithPassword(email, password) {
        const user = await this.user.findByEmail(email);
        if (!user || !user.email) throw new Error("Email not registered yet");

        const hashedPassword = encryptPassword(password);
        const authUser = await this.user.findByEmailAndPasswordHash(email, hashedPassword);
        return authUser;
    }

    async googleLogin(id, email, provider) {
        const emailExist = await this.user.findByEmail(email)
        const hashedPassword = encryptPassword(id + email)
    
        if (!emailExist) {
            //Signup
            const newUser = await this.user.create({ 
            email: email,
                password: hashedPassword,
                provider: provider
            })

            return {
                id: newUser.user_id,
                email: newUser.email
            }
        }

        if (emailExist && emailExist.password == hashedPassword && emailExist.provider == provider) {
            //Login. Provider must check if it has a value of google (optional)
            console.log("EMAIL: Logged-in success")
            return {
                id: emailExist.user_id,
                message: "Logged in."
            }
        }    
    }
}

export default AccountService;
