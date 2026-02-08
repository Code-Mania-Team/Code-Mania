import jwt from "jsonwebtoken";
import { generateAccessToken } from "../../utils/token.js";
import User from "../../models/user.js";


class RefreshController {
    constructor() {
        this.user = new User();
    }

    async refreshAccessToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ success: false, message: "No refresh token" });
            }
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
            const user = await this.user.getUserById(decoded.user_id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            const newAccessToken = generateAccessToken({
                id: user.id,
                username: user.username
            });
            return res.status(200).json({
                success: true,
                accessToken: newAccessToken
            });
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }
    }
};

// export const refreshAccessToken = (req, res) => {

//     try {
//         const refreshToken = req.cookies.refreshToken;
//         if (!refreshToken) {
//             return res.status(401).json({ success: false, message: "No refresh token" });
//         }

        
//         const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
//         const user 
//         const newAccessToken = generateAccessToken({
//             id: decoded.id,
//             username: decoded.username
//         });

//         return res.status(200).json({
//             success: true,
//             accessToken: newAccessToken
//         });
//     } catch (err) {
//         return res.status(401).json({ success: false, message: "Invalid refresh token" });
//     }
// };
export default RefreshController;