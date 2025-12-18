// server.js (cleaned & fixed)
import express from 'express';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
// import passport from 'passport';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config.js';
import v1 from './routes/v1/index.js';
import './core/supabaseClient.js';
import './core/oauthSetup.js';

const app = express();
const port = process.env.PORT || 3000;

// app.set('trust-proxy', 1)
/* ---------------------------------
   Middleware
----------------------------------- */
app.use(morgan('combined'));
app.use(cookieParser());
app.use(cookieSession({
  name: 'codemania',
  keys: ['codemaniaAPI'],
  maxAge: 24 * 60 * 60 * 1000
}));

// app.use(passport.initialize());
// if (passport.initialize()) {
//   console.log('Initialize passport')
// } else { console.error('Passport initialization failed.')}
// app.use(passport.session());
// if (passport.session()) {
//   console.log('Passport session.')
// } else { console.error('Passport session failed.')}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ✅ Use built-in Express body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------------------------
   Routes
----------------------------------- */
app.use('/v1', v1);

/* ---------------------------------
   Health Check
----------------------------------- */
app.get('/', (req, res) => {
  // res.cookie('cookie', 'codemaniaBackend', {maxAge: 24 * 60 * 60 * 1000});
  res.json({message: 'Backend is running successfully!' });
});

/* ---------------------------------
   Start Server
----------------------------------- */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
