// server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import 'dotenv/config.js';
import v1 from './routes/v1/index.js';
import './core/supabaseClient.js'  // Ensure this import is present

const app = express();
const port = process.env.PORT || 3000;


/* ---------------------------------
   2️⃣ Middlewares
----------------------------------- */
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// // Configure CORS for frontend communication
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:5173', // your frontend
//     credentials: true, // allow cookies
//   })
// );

/* ---------------------------------
   3️⃣ Routes
----------------------------------- */
app.use('/v1', cors(), v1);


/* ---------------------------------
   4️⃣ Health Check Route
----------------------------------- */
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running successfully!' });
});


/* ---------------------------------
   5️⃣ Server Init
----------------------------------- */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
