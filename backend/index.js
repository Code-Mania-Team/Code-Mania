// server.js (cleaned & fixed)
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config.js';
import v1 from './routes/v1/index.js';
import './core/supabaseClient.js';
import './core/oauthSetup.js';

const app = express();
const port = process.env.PORT || 3000;

/* ---------------------------------
   Middleware
----------------------------------- */
app.use(morgan('combined'));
app.use(cookieParser());

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
  res.json({ message: 'Backend is running successfully!' });
});

/* ---------------------------------
   Start Server
----------------------------------- */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
