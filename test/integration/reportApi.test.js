const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chai = require('chai');
const request = require('supertest');
const { app, server, redisClient } = require('../../server'); // Ensure this path is correct
const Expense = require('../../models/expense'); // Ensure this path is correct
const Budget = require('../../models/budget'); // Ensure this path is correct
const jwt = require('jsonwebtoken');

const { expect } = chai;
let mongoServer;
let token;
let userId;

describe('Reports API Test', function () {

  before(async function () {

    try {
      // Set up MongoDB in-memory server
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);

      // Register and log in a user to get a token
      await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', email: 'testuser@example.com', password: 'testpassword' });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'testuser@example.com', password: 'testpassword' });

      token = loginRes.body.token;

      // Decode the token to get the userId
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      console.error("Error in before hook:", error);
      throw error;
    }
  });

  // After all tests
  after(async function () {

    try {
      await mongoose.disconnect();
      if (mongoServer) {
        await mongoServer.stop();
      }
      if (redisClient) {
        await redisClient.quit(); // Ensure Redis client is properly closed
      }
      server.close(); // Ensure the server is properly closed
    } catch (error) {
      console.error("Error in after hook:", error);
      throw error;
    }
  });

  // Before each test
  beforeEach(async function () {
    try {
      // Ensure each test starts with a clean database
      const collections = await mongoose.connection.db.collections();
      for (let collection of collections) {
        await collection.deleteMany();
      }
    } catch (error) {
      console.error("Error in beforeEach hook:", error);
      throw error;
    }
  });

  const queryAllExpenses = async () => {
    return await Expense.find({});

  };

  describe('GET /reports/monthly', () => {
    it('should get monthly report for the user', async () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      await Expense.create([
        { userId, description: 'Test Expense 1', amount: 100, date: new Date(currentYear, currentMonth, 2) },
        { userId, description: 'Test Expense 2', amount: 200, date: new Date(currentYear, currentMonth, 15) }
      ]);

      await Budget.create([
        { userId, category: 'Test Budget 1', amount: 1000, startDate: new Date(currentYear, currentMonth - 1, 1), endDate: new Date(currentYear, currentMonth + 1, 1) },
        { userId, category: 'Test Budget 2', amount: 2000, startDate: new Date(currentYear, currentMonth, 1), endDate: new Date(currentYear, currentMonth + 2, 1) }
      ]);

      const res = await request(app)
        .get('/reports/monthly')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('totalExpenses', 300);
      expect(res.body).to.have.property('totalBudgets', 3000);

    });
  });

  describe('GET /reports/yearly', () => {
    it('should get yearly report for the user', async () => {
      const currentYear = new Date().getFullYear();

      await Expense.create([
        { userId, description: 'Test Expense 1', amount: 100, date: new Date(currentYear, 0, 1) },
        { userId, description: 'Test Expense 2', amount: 200, date: new Date(currentYear, 5, 15) }
      ]);

      await Budget.create([
        { userId, category: 'Test Budget 1', amount: 1000, startDate: new Date(currentYear - 1, 11, 1), endDate: new Date(currentYear, 11, 31) },
        { userId, category: 'Test Budget 2', amount: 2000, startDate: new Date(currentYear, 0, 1), endDate: new Date(currentYear + 1, 0, 1) }
      ]);

      const res = await request(app)
        .get('/reports/yearly')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('totalExpenses', 300);
      expect(res.body).to.have.property('totalBudgets', 3000);
    });
  });
});
