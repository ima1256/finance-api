const express = require('express');
const https = require('https');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const setupSwagger = require('./swagger');

const app = express();

app.use(helmet()); // Use helmet for security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Setup Swagger documentation
setupSwagger(app);

// Your route files
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets'); // Add budget routes if you have them

app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/budgets', budgetRoutes); // Add this line

// SSL configuration for HTTPS
const sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const PORT = process.env.PORT || 5000;
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
