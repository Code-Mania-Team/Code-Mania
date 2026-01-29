import crypto from 'crypto';

export function encryptPassword(password) {
  return crypto.createHmac('sha256', process.env.API_SECRET_KEY)
    .update(password)
    .digest('hex');
};



// not use since walang pasword only email lang