const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/expense');
const router = express.Router();
const authMiddleware = require('../middleware/auth');


module.exports = (redisCache) => {

  router.use(authMiddleware);

  router.get('/', async (req, res) => {
    try {

      const expenses = await redisCache.getOrSetData(`expenses:${req.userId}`, async () => {
        return await Expense.find({ userId: req.userId });
      })

      res.json(expenses);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', [
    body('description').trim().escape().notEmpty().withMessage('Description is required'),
    body('amount').isNumeric().withMessage('Amount must be a number').trim().escape(),
    body('date').optional().isISO8601().toDate().withMessage('Date must be a valid date')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, date } = req.body;
    try {
      const expense = new Expense({ userId: req.userId, description, amount, date });
      await expense.save();
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/:id', [
    body('description').optional().notEmpty().trim().escape().withMessage('Description is required'),
    body('amount').optional().isNumeric().trim().escape().withMessage('Amount must be a number'),
    body('date').optional().isISO8601().toDate().withMessage('Date must be a valid date')
  ], async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, date } = req.body;
    try {
      const expense = await Expense.findOneAndUpdate(
        { _id: id, userId: req.userId }, // Ensure the expense belongs to the user
        { description, amount, date },
        { new: true }
      );
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const expense = await Expense.findOneAndDelete({ _id: id, userId: req.userId }); // Ensure the expense belongs to the user
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;

}
