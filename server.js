require('newrelic'); // This must be the first line

const express = require('express');
const https = require('https');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const setupSwagger = require('./swagger');

const app = express();
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
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

const sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const PORT = process.env.PORT || 5000;
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
