import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/v1/account/login/google/redirect',
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));