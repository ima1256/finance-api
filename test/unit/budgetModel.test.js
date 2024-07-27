const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chai = require('chai');
const chaiDatetime = require('chai-datetime');
const Budget = require('../../models/budget');

chai.use(chaiDatetime);

const { expect } = chai;

describe('Budget Model Test', () => {
  let mongoServer;

  // Before all tests
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {

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

  it('create & save budget successfully', async () => {
    const validBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      category: 'Test Category',
      amount: 1000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });

    const savedBudget = await validBudget.save();

    // Assertions
    expect(savedBudget._id).to.exist;
    expect(savedBudget.category).to.equal(validBudget.category);
    expect(savedBudget.amount).to.equal(validBudget.amount);
    expect(savedBudget.startDate).to.be.a('date');
    expect(savedBudget.endDate).to.be.a('date');
  });

  it('insert budget without required fields should fail', async () => {
    const invalidBudget = new Budget({
      category: 'Test Category'
    });
    let err;
    try {
      const savedBudget = await invalidBudget.save();
      err = savedBudget;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).to.exist;
    expect(err.errors.startDate).to.exist;
    expect(err.errors.endDate).to.exist;
  });

  it('budget without category should fail', async () => {
    const invalidBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      amount: 1000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });
    let err;
    try {
      const savedBudget = await invalidBudget.save();
      err = savedBudget;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.category).to.exist;
  });

  it('budget with non-numeric amount should fail', async () => {
    const invalidBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      category: 'Test Category',
      amount: 'invalid_amount',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });
    let err;
    try {
      const savedBudget = await invalidBudget.save();
      err = savedBudget;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.amount).to.exist;
  });

  it('budget with null userId should fail', async () => {
    const invalidBudget = new Budget({
      userId: null,
      category: 'Test Category',
      amount: 1000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });
    let err;
    try {
      const savedBudget = await invalidBudget.save();
      err = savedBudget;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.userId).to.exist;
  });

  it('budget with endDate earlier than startDate should fail', async () => {
    const invalidBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      category: 'Test Category',
      amount: 1000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
    });
    let err;
    try {
      const savedBudget = await invalidBudget.save();
      err = savedBudget;
    } catch (error) {
      err = error;
    }
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors.endDate).to.exist;
  });

  it('budget with valid startDate and endDate should be saved successfully', async () => {
    const validBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      category: 'Test Category',
      amount: 1000,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });

    const savedBudget = await validBudget.save();

    // Assertions
    expect(savedBudget._id).to.exist;
    expect(savedBudget.category).to.equal(validBudget.category);
    expect(savedBudget.amount).to.equal(validBudget.amount);
    expect(savedBudget.startDate).to.be.a('date');
    expect(savedBudget.endDate).to.be.a('date');
    expect(savedBudget.endDate).to.be.afterDate(savedBudget.startDate);
  });

  it('saving multiple budgets for the same user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const budgets = [
      { userId, category: 'Category 1', amount: 1000, startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) },
      { userId, category: 'Category 2', amount: 2000, startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)) }
    ];

    for (const bud of budgets) {
      const validBudget = new Budget(bud);
      const savedBudget = await validBudget.save();
      expect(savedBudget._id).to.exist;
      expect(savedBudget.category).to.equal(bud.category);
      expect(savedBudget.amount).to.equal(bud.amount);
      expect(savedBudget.startDate).to.be.a('date');
      expect(savedBudget.endDate).to.be.a('date');
    }
  });

  it('budget with a future startDate should be saved successfully', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const validBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      category: 'Future Budget',
      amount: 1500,
      startDate: futureDate,
      endDate: new Date(futureDate.setMonth(futureDate.getMonth() + 1))
    });

    const savedBudget = await validBudget.save();

    // Assertions
    expect(savedBudget._id).to.exist;
    expect(savedBudget.category).to.equal(validBudget.category);
    expect(savedBudget.amount).to.equal(validBudget.amount);
    expect(savedBudget.startDate).to.equalDate(futureDate);
    expect(savedBudget.endDate).to.be.a('date');
  });

  it('budget with a past startDate should be saved successfully', async () => {
    const pastDate = new Date('1900-01-01');
    const endDate = new Date(pastDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const validBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      category: 'Past Budget',
      amount: 500,
      startDate: pastDate,
      endDate: endDate
    });

    const savedBudget = await validBudget.save();

    // Assertions
    expect(savedBudget._id).to.exist;
    expect(savedBudget.category).to.equal(validBudget.category);
    expect(savedBudget.amount).to.equal(validBudget.amount);
    expect(savedBudget.startDate).to.equalDate(pastDate);
    expect(savedBudget.endDate).to.be.a('date');
  });

  it('budget with equal startDate and endDate should be saved successfully', async () => {
    const validBudget = new Budget({
      userId: new mongoose.Types.ObjectId(),
      category: 'Equal Dates Budget',
      amount: 1000,
      startDate: new Date(),
      endDate: new Date()
    });

    const savedBudget = await validBudget.save();

    // Assertions
    expect(savedBudget._id).to.exist;
    expect(savedBudget.category).to.equal(validBudget.category);
    expect(savedBudget.amount).to.equal(validBudget.amount);
    expect(savedBudget.startDate).to.be.a('date');
    expect(savedBudget.endDate).to.be.a('date');
    expect(savedBudget.startDate).to.equalDate(savedBudget.endDate);
  });
});
