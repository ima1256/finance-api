const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chai = require('chai');
const chaiDatetime = require('chai-datetime');
const Expense = require('../../models/expense');

chai.use(chaiDatetime);

const { expect } = chai;

describe('Expense Model Test', () => {
  let mongoServer;

  // Before all tests
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
  });

  // After all tests
  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Before each test
  beforeEach(async () => {
    // Ensure each test starts with a clean database
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany();
    }
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
    expect(savedExpense._id).to.exist;
    expect(savedExpense.description).to.equal(validExpense.description);
    expect(savedExpense.amount).to.equal(validExpense.amount);
    expect(savedExpense.date).to.be.a('date');
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
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).to.exist;
  });

  it('default date value should be set', async () => {
    const validExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Test Expense',
      amount: 100
    });

    const savedExpense = await validExpense.save();

    // Assertions
    expect(savedExpense.date).to.be.a('date');
    expect(savedExpense.date).to.equalDate(new Date());
  });

  it('expense without description should fail', async () => {
    const invalidExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      amount: 100
    });
    let err;
    try {
      const savedExpense = await invalidExpense.save();
      err = savedExpense;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.description).to.exist;
  });

  it('expense with non-numeric amount should fail', async () => {
    const invalidExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Test Expense',
      amount: 'invalid_amount'
    });
    let err;
    try {
      const savedExpense = await invalidExpense.save();
      err = savedExpense;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).to.exist;
  });

  it('expense with negative amount should be saved successfully', async () => {
    const validExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Test Expense',
      amount: -100,
      date: new Date()
    });

    const savedExpense = await validExpense.save();

    // Assertions
    expect(savedExpense._id).to.exist;
    expect(savedExpense.description).to.equal(validExpense.description);
    expect(savedExpense.amount).to.equal(validExpense.amount);
    expect(savedExpense.date).to.be.a('date');
  });

  // Additional Tests

  it('expense with null userId should fail', async () => {
    const invalidExpense = new Expense({
      userId: null,
      description: 'Test Expense',
      amount: 100
    });
    let err;
    try {
      const savedExpense = await invalidExpense.save();
      err = savedExpense;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.userId).to.exist;
  });

  it('expense with minimum amount (0) should be saved successfully', async () => {
    const validExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Test Expense',
      amount: 0,
      date: new Date()
    });

    const savedExpense = await validExpense.save();

    // Assertions
    expect(savedExpense._id).to.exist;
    expect(savedExpense.description).to.equal(validExpense.description);
    expect(savedExpense.amount).to.equal(validExpense.amount);
    expect(savedExpense.date).to.be.a('date');
  });

  it('expense with maximum amount should be saved successfully', async () => {
    const validExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Test Expense',
      amount: Number.MAX_SAFE_INTEGER,
      date: new Date()
    });

    const savedExpense = await validExpense.save();

    // Assertions
    expect(savedExpense._id).to.exist;
    expect(savedExpense.description).to.equal(validExpense.description);
    expect(savedExpense.amount).to.equal(validExpense.amount);
    expect(savedExpense.date).to.be.a('date');
  });

  it('saving multiple expenses for the same user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const expenses = [
      { userId, description: 'Test Expense 1', amount: 100, date: new Date() },
      { userId, description: 'Test Expense 2', amount: 200, date: new Date() }
    ];

    for (const exp of expenses) {
      const validExpense = new Expense(exp);
      const savedExpense = await validExpense.save();
      expect(savedExpense._id).to.exist;
      expect(savedExpense.description).to.equal(exp.description);
      expect(savedExpense.amount).to.equal(exp.amount);
      expect(savedExpense.date).to.be.a('date');
    }
  });

  it('expense with a future date should be saved successfully', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const validExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Future Expense',
      amount: 150,
      date: futureDate
    });

    const savedExpense = await validExpense.save();

    // Assertions
    expect(savedExpense._id).to.exist;
    expect(savedExpense.description).to.equal(validExpense.description);
    expect(savedExpense.amount).to.equal(validExpense.amount);
    expect(savedExpense.date).to.equalDate(futureDate);
  });

  it('expense with a very old date should be saved successfully', async () => {
    const pastDate = new Date('1900-01-01');

    const validExpense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: 'Past Expense',
      amount: 50,
      date: pastDate
    });

    const savedExpense = await validExpense.save();

    // Assertions
    expect(savedExpense._id).to.exist;
    expect(savedExpense.description).to.equal(validExpense.description);
    expect(savedExpense.amount).to.equal(validExpense.amount);
    expect(savedExpense.date).to.equalDate(pastDate);
  });
});
