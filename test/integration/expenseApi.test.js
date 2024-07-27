const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chai = require('chai');
const request = require('supertest');
const { app, server, redisClient } = require('../../server'); // Ensure this path is correct
const Expense = require('../../models/expense'); // Ensure this path is correct
const jwt = require('jsonwebtoken');

const { expect } = chai;
let mongoServer;
let token;
let userId;

describe('Expense API Test', function () {

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
    this.timeout(10000); // Increase timeout for the after hook
    try {
      await mongoose.disconnect();
      if (mongoServer) {
        await mongoServer.stop();
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

  describe('GET /expenses', () => {
    it('should get all expenses for the user', async () => {
      await Expense.create([
        { userId, description: 'Test Expense 1', amount: 100, date: new Date() },
        { userId, description: 'Test Expense 2', amount: 200, date: new Date() }
      ]);

      const res = await request(app)
        .get('/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      expect(res.body[0].description).to.equal('Test Expense 1');
      expect(res.body[1].description).to.equal('Test Expense 2');
    });
  });

  describe('POST /expenses', () => {
    it('should create a new expense', async () => {
      const res = await request(app)
        .post('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'New Expense', amount: 300, date: new Date() });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('_id');
      expect(res.body.description).to.equal('New Expense');
      expect(res.body.amount).to.equal(300);
      expect(res.body.userId).to.equal(userId.toString());
    });

    it('should not create an expense with invalid data', async () => {
      const res = await request(app)
        .post('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: '', amount: 'invalid_amount' });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
    });
  });

  describe('PUT /expenses/:id', () => {
    it('should update an existing expense', async () => {
      const expense = await Expense.create({ userId, description: 'Update Expense', amount: 100, date: new Date() });

      const res = await request(app)
        .put(`/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated Expense', amount: 200 });

      expect(res.status).to.equal(200);
      expect(res.body.description).to.equal('Updated Expense');
      expect(res.body.amount).to.equal(200);
    });

    it('should return 404 if expense not found', async () => {
      const res = await request(app)
        .put(`/expenses/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated Expense', amount: 200 });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
    });
  });

  describe('DELETE /expenses/:id', () => {
    it('should delete an existing expense', async () => {
      const expense = await Expense.create({ userId, description: 'Delete Expense', amount: 100, date: new Date() });

      const res = await request(app)
        .delete(`/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Expense deleted successfully');
    });

    it('should return 404 if expense not found', async () => {
      const res = await request(app)
        .delete(`/expenses/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
    });
  });
});
