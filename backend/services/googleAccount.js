import User from "../models/user.js";
import { encryptPassword } from "../utils/hash.js";

class GoogleAccount {
    constructor () {
        this.user = new User();
    }

    async loginIfExist(id, email, provider) {
        const emailExist = await this.user.findByEmail(email)
        const hashedPassword = encryptPassword(id + email)
        
        try {
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

            if (emailExist) {
                //Login. Provider must check if it has a value of google (optional)
                console.log("EMAIL: Already exist!")
                return "Logged In Success"
            }

        } catch (err) {
            return err
        }
    }
}

export default GoogleAccount;