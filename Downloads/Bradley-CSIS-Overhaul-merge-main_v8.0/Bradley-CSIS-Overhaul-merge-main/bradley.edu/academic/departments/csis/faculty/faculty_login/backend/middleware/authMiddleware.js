// backend/middleware/authMiddleware.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log("Decoded User ID:", req.user.id);  // Log the decoded user id
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  }
  

function isAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admins only' });
}
module.exports = {
    authenticate: authenticate,
    isAdmin: isAdmin,
  }