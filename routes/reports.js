const express = require('express');
const Expense = require('../models/expense');
const Budget = require('../models/budget');
const router = express.Router();
const authMiddleware = require('../middleware/auth');


module.exports = (redisCache) => {

  router.use(authMiddleware);

  // Helper function to get the start and end dates for the given month
  function getMonthStartEndDates(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);
    return { startDate, endDate };
  }

  router.get('/monthly', async (req, res) => {

    try {

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const key = `reports:${req.userId}:monthly`;
      const result = await redisCache.getOrSetData(key, async () => {

        const { startDate, endDate } = getMonthStartEndDates(currentYear, currentMonth);

        // Find all expenses for the user in the given month
        const expenses = await Expense.find({
          userId: req.userId,
          date: { $gte: startDate, $lt: endDate }
        });

        // Calculate the total expenses
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        const currentDate = new Date();

        const budgets = await Budget.find({
          userId: req.userId,
          startDate: { $lte:  currentDate },
          endDate: { $gte: currentDate }
        });

        const totalBudgets = budgets.reduce((sum, budget) => sum + budget.amount, 0);


        return {
          totalExpenses,
          totalBudgets
        };

      });

      res.json(result);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/yearly', async (req, res) => {
    try {

      const currentYear = new Date().getFullYear();

      const key = `reports:${req.userId}:yearly`;
      const result = await redisCache.getOrSetData(key, async () => {

        const expenses = await Expense.find({
          userId: req.userId,
          date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) }
        });

        // Calculate the total expenses
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        const budgets = await Budget.find({
          userId: req.userId,
          startDate: { $lte:  new Date(currentYear, 11, 31) },
          endDate: { $gte: new Date(currentYear, 0, 1) }
        });

        const totalBudgets = budgets.reduce((sum, budget) => sum + budget.amount, 0);

        return {
          totalExpenses,
          totalBudgets
        };

      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;

}
