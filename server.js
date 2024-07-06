require('dotenv').config();
require('newrelic'); // This must be the first line

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const mongoose = require('mongoose'); // Add Mongoose
const setupSwagger = require('./swagger');
const fs = require('fs');
const https = require('https');

const app = express();
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

setupSwagger(app);

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const reportRoutes = require('./routes/reports');

app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/budgets', budgetRoutes);
app.use('/reports', reportRoutes);

const PORT = process.env.PORT;

// HTTPS options
let server;
if (fs.existsSync('key.pem') && fs.existsSync('cert.pem')) {
  const sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  };
  server = https.createServer(sslOptions, app);
  console.log(`HTTPS server running on https://0.0.0.0:${PORT}`);
} else {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server running on http://0.0.0.0:${PORT}`);
  });
}

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
