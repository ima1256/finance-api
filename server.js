const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const reportRoutes = require('./routes/reports');
const setupSwagger = require('./swagger');

const app = express();
app.use(express.json());

const mongoURI = process.env.NODE_ENV === 'test' 
  ? 'mongodb://localhost:27017/finance_test'
  : 'mongodb://localhost:27017/finance';

mongoose.connect(mongoURI).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error.message);
});

app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/budgets', budgetRoutes);
app.use('/reports', reportRoutes);

// Setup Swagger documentation
setupSwagger(app);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
