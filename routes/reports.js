const express = require('express');
const Expense = require('../models/expense');
const Budget = require('../models/budget');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const redisClient = require('../redisClient');

router.use(authMiddleware);

const cacheMiddleware = (req, res, next) => {
  const key = `reports:${req.userId}:${req.path}`;
  redisClient.get(key, (err, data) => {
    if (err) throw err;
    if (data) {
      res.json(JSON.parse(data));
    } else {
      next();
    }
  });
};

router.get('/monthly', cacheMiddleware, async (req, res) => {
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

    const result = {
      totalExpenses: expenses[0] ? expenses[0].total : 0,
      totalBudgets: budgets[0] ? budgets[0].total : 0
    };

    redisClient.setex(`reports:${req.userId}:${req.path}`, 3600, JSON.stringify(result));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/yearly', cacheMiddleware, async (req, res) => {
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

    const result = {
      totalExpenses: expenses[0] ? expenses[0].total : 0,
      totalBudgets: budgets[0] ? budgets[0].total : 0
    };

    redisClient.setex(`reports:${req.userId}:${req.path}`, 3600, JSON.stringify(result));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
