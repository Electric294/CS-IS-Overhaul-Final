require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const sectionContentRoutes = require('./routes/sectionContentRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ✅ Apply CORS middleware EARLY — before any routes
const corsOptions = {
  origin: 'http://localhost:3000', // React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Other middleware
app.use(express.json());

// ✅ Route middleware — AFTER CORS
app.use('/api/auth', authRoutes);
app.use('/api/section-content', sectionContentRoutes);
app.use('/api/content', sectionRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api', adminRoutes); // Moved below to ensure CORS applies first
app.use('/api/users', userRoutes);


// ✅ DB + Server start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
}).catch(err => console.error(err));
