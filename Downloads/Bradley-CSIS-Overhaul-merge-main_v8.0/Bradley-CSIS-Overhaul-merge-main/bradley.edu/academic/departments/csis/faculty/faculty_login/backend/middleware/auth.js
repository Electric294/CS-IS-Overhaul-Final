
require('dotenv').config();

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔐 Middleware to authenticate JWT
function authenticate(req, res, next) {
  console.log("🔐 Authorization header:", req.headers.authorization);

  const token = req.headers.authorization?.split(" ")[1];
  console.log("🧾 Extracted Token:", token);

  
  if (!token) return res.status(401).json({ error: 'Missing token' });
  console.log("JWT Secret in middleware:", process.env.JWT_SECRET);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded Token:", decoded); // <-- Debug line
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed: ", err.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
}


// 🔐 Admin-only middleware
function isAdmin(req, res, next) {
  console.log(req.user);  // In the isAdmin middleware, add this line
  console.log("🛂 Checking if user is admin:", req.user);

  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admins only' });
}

// 📋 GET all users (admin only)
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username role'); // limit fields
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    
    const user = new User({ username, password: hashedPassword, role: 'editor' });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Ensure user has _id and role
    if (!user._id || !user.role) {
      console.error("❌ Missing user ID or role:", user);
      return res.status(500).json({ error: 'User data is incomplete' });
    }

    // Generate the JWT token (keeping _id as ObjectId)
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ token: accessToken, username: user.username, _id: user._id, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(403).json({ error: 'Refresh token required' });

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid refresh token' });

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // New access token
    );

    res.json({ token: newAccessToken });
  });
});


module.exports = router;