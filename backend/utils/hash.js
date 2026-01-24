import crypto from 'crypto';

export function encryptPassword(password) {
  return crypto.createHmac('sha256', process.env.API_SECRET_KEY)
    .update(password)
    .digest('hex');
<<<<<<< Updated upstream
};
=======
};



// not use since walang pasword only email lang
//may use na
>>>>>>> Stashed changes
