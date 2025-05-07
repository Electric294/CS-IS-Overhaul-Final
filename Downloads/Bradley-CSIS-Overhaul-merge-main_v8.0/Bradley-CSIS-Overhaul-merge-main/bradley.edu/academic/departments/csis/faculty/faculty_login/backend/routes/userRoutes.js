const express = require('express');
const router = express.Router();
const User =  require('../models/User');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const {authenticate, isAdmin} = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
    
        // Basic validation
        if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required.' });
        }
    
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
        return res.status(409).json({ message: 'Username already taken.' });
        }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Create and save the user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
    
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
    });

    router.put('/change-username', async (req, res) => {
        try {
          const { newUsername } = req.body;
      
          if (!newUsername || newUsername.trim() === '') {
            return res.status(400).json({ message: 'New username is required.' });
          }
      
          // Check if new username is already taken
          const existingUser = await User.findOne({ username: newUsername });
          if (existingUser) {
            return res.status(409).json({ message: 'Username is already taken.' });
          }
      
          // Update username
          const user = await User.findById(req.user.id);
          if (!user) {
            return res.status(404).json({ message: 'User not found.' });
          }
      
          user.username = newUsername;
          await user.save();
      
          res.status(200).json({ message: 'Username updated successfully.' });
        } catch (error) {
          console.error('Username change error:', error);
          res.status(500).json({ message: 'Server error during username update.' });
        }
      });

      router.get('/', authenticate, isAdmin, async (req, res) => {
        try {
          const users = await User.find({}, 'username'); // Only fetch _id and username
          res.json(users);
        } catch (err) {
          console.error('Error fetching users:', err);
          res.status(500).json({ message: 'Server error fetching users' });
        }
      });
      

module.exports = router;
