// routes/reports.js
const express = require('express');
const Expense = require('../models/expense');
const Budget = require('../models/budget');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/monthly', async (req, res) => {
  try {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const expenses = await Expense.aggregate([
      { $match: { userId: req.userId, date: { $gte: new Date(currentYear, currentMonth, 1), $lt: new Date(currentYear, currentMonth + 1, 1) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const budgets = await Budget.aggregate([
      { $match: { userId: req.userId, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      totalExpenses: expenses[0] ? expenses[0].total : 0,
      totalBudgets: budgets[0] ? budgets[0].total : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/yearly', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const expenses = await Expense.aggregate([
      { $match: { userId: req.userId, date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const budgets = await Budget.aggregate([
      { $match: { userId: req.userId, startDate: { $lte: new Date(currentYear, 11, 31) }, endDate: { $gte: new Date(currentYear, 0, 1) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      totalExpenses: expenses[0] ? expenses[0].total : 0,
      totalBudgets: budgets[0] ? budgets[0].total : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
