const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chai = require('chai');
const request = require('supertest');
const { app, server, redisClient } = require('../../server'); // Ensure this path is correct
const Budget = require('../../models/budget'); // Ensure this path is correct
const jwt = require('jsonwebtoken');

const { expect } = chai;
let mongoServer;
let token;
let userId;

describe('Budget API Test', function () {

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

  describe('GET /budgets', () => {
    it('should get all budgets for the user', async () => {
      await Budget.create([
        { userId, category: 'Test Budget 1', amount: 1000, startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) },
        { userId, category: 'Test Budget 2', amount: 2000, startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)) }
      ]);

      const res = await request(app)
        .get('/budgets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      expect(res.body[0].category).to.equal('Test Budget 1');
      expect(res.body[1].category).to.equal('Test Budget 2');
    });
  });

  describe('POST /budgets', () => {
    it('should create a new budget', async () => {
      const res = await request(app)
        .post('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'New Budget', amount: 3000, startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('_id');
      expect(res.body.category).to.equal('New Budget');
      expect(res.body.amount).to.equal(3000);
      expect(res.body.userId).to.equal(userId.toString());
    });

    it('should not create a budget with invalid data', async () => {
      const res = await request(app)
        .post('/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: '', amount: 'invalid_amount' });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
    });
  });

  describe('PUT /budgets/:id', () => {
    it('should update an existing budget', async () => {
      const budget = await Budget.create({ userId, category: 'Update Budget', amount: 1000, startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) });

      const res = await request(app)
        .put(`/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'Updated Budget', amount: 2000 });

      expect(res.status).to.equal(200);
      expect(res.body.category).to.equal('Updated Budget');
      expect(res.body.amount).to.equal(2000);
    });

    it('should return 404 if budget not found', async () => {
      const res = await request(app)
        .put(`/budgets/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'Updated Budget', amount: 2000 });

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
    });
  });

  describe('DELETE /budgets/:id', () => {
    it('should delete an existing budget', async () => {
      const budget = await Budget.create({ userId, category: 'Delete Budget', amount: 1000, startDate: new Date(), endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) });

      const res = await request(app)
        .delete(`/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Budget deleted successfully');
    });

    it('should return 404 if budget not found', async () => {
      const res = await request(app)
        .delete(`/budgets/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('error');
    });
  });
});
