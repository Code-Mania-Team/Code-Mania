// routes/v1/accountRoutes.js
import express from "express";
import AccountController from "../../controllers/v1/accountController.js";
import { authentication } from "../../middlewares/authentication.js";
import { authorization } from "../../middlewares/authorization.js";
import passport from "passport";
const accountRouter = express.Router();
const account = new AccountController();
// Optional: protect some routes with authorization middleware
// accountRouter.use(authorization);
// Request OTP (signup or login) – single endpoint
accountRouter.post("/signup/request-otp", account.requestOtp.bind(account));
// Verify OTP after user clicks or enters it
accountRouter.post("/signup/verify-otp", account.verifyOtp.bind(account));
// Set username (requires authentication)
accountRouter.post(
  "/setOnboarding",
  authentication,
  account.setUsernameAndCharacter.bind(account),
);
accountRouter.post("/login", account.login.bind(account));
accountRouter.get(
  "/login/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);
accountRouter.get(
  "/login/google/redirect",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    account.googleLogin(req, res);
  },
);
accountRouter.post("/logout", account.logout.bind(account));
// Get current user's profile
accountRouter.get("/", authentication, account.profile.bind(account));
// Update profile (username/full_name)
accountRouter.patch("/", authentication, account.updateProfile.bind(account));
// Delete account
accountRouter.delete("/", authentication, account.deleteUser.bind(account));
export default accountRouter;
