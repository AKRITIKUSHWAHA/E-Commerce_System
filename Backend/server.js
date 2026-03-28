const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const { connectDB }    = require('./config/db');
const routes           = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Uploaded images serve karna
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Sab API routes
app.use('/api', routes);

// 3. Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// --- YAHAN SE NAYA CODE START (Frontend Serve karne ke liye) ---

// 4. Frontend ke static "dist" folder ko connect karo
// Note: Render par ye '../frontend/dist' path tabhi kaam karega jab aapka folder structure sahi ho
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 5. Agar koi route API nahi hai, toh seedha Frontend ki index.html dikhao
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// --- NAYA CODE END ---

// Global error handler (Ise niche hi rehne dena)
app.use(errorHandler);

// Server start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ShopKart API running on http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
  });
});