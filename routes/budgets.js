// routes/budgets.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/budget');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Budget management
 */

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Get all budgets
 *     tags: [Budgets]
 *     responses:
 *       200:
 *         description: List of all budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Budget'
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Add a new budget
 *     tags: [Budgets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *     responses:
 *       201:
 *         description: Budget created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/', [
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
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

/**
 * @swagger
 * /budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Budget not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', [
  body('category').optional().notEmpty().withMessage('Category is required'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
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

/**
 * @swagger
 * /budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *       404:
 *         description: Budget not found
 *       500:
 *         description: Internal server error
 */
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
