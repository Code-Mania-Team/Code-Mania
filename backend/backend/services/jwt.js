import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.API_SECRET_KEY;
const JWT_EXPIRES_IN = "90d";

class jwtService {
  /**
   * Generate a JWT token
   * @param {Object} payload - The data to include in the token (e.g., email, account_id)
   * @param {String} [expiresIn] - Optional expiration (default from env)
   * @returns {String} JWT token
   */
  sign(payload, expiresIn = JWT_EXPIRES_IN) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  /**
   * Verify a JWT token
   * @param {String} token - JWT token
   * @returns {Object} Decoded payload if valid, throws error if invalid
   */
  verify(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Decode a JWT without verifying
   * @param {String} token
   * @returns {Object} Decoded payload
   */
  decode(token) {
    return jwt.decode(token);
  }
}

export default new jwtService();