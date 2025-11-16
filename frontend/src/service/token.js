import axios from 'axios';

async function verifyToken(token) {
  try {
    const res = await axios.post('http://localhost:3000/v1/verify', { token }, {
      withCredentials: true, // if your backend sets cookies
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Backend verification response:', res.data);
  } catch (err) {
    console.error('Backend verification failed:', err.response?.data || err.message);
  }
}
export { verifyToken };
