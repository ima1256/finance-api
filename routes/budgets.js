const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/budget');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', [
  body('category').trim().escape().notEmpty().withMessage('Category is required'),
  body('amount').isNumeric().trim().escape().withMessage('Amount must be a number'),
  body('startDate').isISO8601().toDate().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().toDate().withMessage('End date must be a valid date')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, amount, startDate, endDate } = req.body;
  try {
    const budget = new Budget({ userId: req.userId, category, amount, startDate, endDate });
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', [
  body('category').optional().notEmpty().trim().escape().withMessage('Category is required'),
  body('amount').optional().isNumeric().trim().escape().withMessage('Amount must be a number'),
  body('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid date')
], async (req, res) => {
  const { id } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, amount, startDate, endDate } = req.body;
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: req.userId }, // Ensure the budget belongs to the user
      { category, amount, startDate, endDate },
      { new: true }
    );
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json(budget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const budget = await Budget.findOneAndDelete({ _id: id, userId: req.userId }); // Ensure the budget belongs to the user
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
