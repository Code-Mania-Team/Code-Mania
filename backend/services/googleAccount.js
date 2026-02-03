import User from "../models/user.js";

class GoogleAccount {
    constructor () {
        this.user = new User();
    }

    async emailExist(email) {
        const data = await this.user.findByEmail(email)
        return data
    }

    async loginIfExist(id, email, provider) {
        const emailExist = await this.emailExist(email);
        console.log(id, provider)
        try {
            if (!emailExist) {
                //Signup
                console.log("EMAIL: Doesn't exist!")
                return "Email Doesn't Exist"
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