const mongoose = require('mongoose');
const Expense = require('../models/expense');

describe('Expense Model Test', () => {
  // Before all tests
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/finance_test', {
      // useNewUrlParser: true,
      // useUnifiedTopology: true
    });
  });

  // After all tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('create & save expense successfully', async () => {
    const validExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Test Expense',
      amount: 100,
      date: new Date()
    });
    const savedExpense = await validExpense.save();

    // Assertions
    expect(savedExpense._id).toBeDefined();
    expect(savedExpense.description).toBe(validExpense.description);
    expect(savedExpense.amount).toBe(validExpense.amount);
    expect(savedExpense.date).toBeInstanceOf(Date);
  });

  it('insert expense without required fields should fail', async () => {
    const invalidExpense = new Expense({
      description: 'Test Expense'
    });
    let err;
    try {
      const savedExpense = await invalidExpense.save();
      err = savedExpense;
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).toBeDefined();
  });
});
