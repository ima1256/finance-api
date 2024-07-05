const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Expense = require('../models/expense');
const jwt = require('jsonwebtoken');

describe('Expense API Integration Test', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/finance_test', {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true
    });

    // Ensure the database is empty before tests
    await mongoose.connection.dropDatabase();

    // Create a user and get token
    await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123'
      });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });

    token = loginResponse.body.token;
    userId = jwt.decode(token).userId; // Decode token to get userId
  });

  afterAll(async () => {
    // Drop the test database after tests
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  it('should create a new expense', async () => {
    const res = await request(app)
      .post('/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Test Expense',
        amount: 100,
        date: new Date()
      });

    //console.log('Created Expense:', res.body); // Log created expense
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.description).toBe('Test Expense');
    expect(res.body.amount).toBe(100);
  });

  it('should fetch all expenses', async () => {
    const res = await request(app)
      .get('/expenses')
      .set('Authorization', `Bearer ${token}`);

    //console.log('Fetched Expenses:', res.body); // Log fetched expenses
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('should update an expense', async () => {
    const newExpense = await new Expense({
      userId: new mongoose.Types.ObjectId(userId), // Ensure the userId is an ObjectId
      description: 'Test Expense',
      amount: 100,
      date: new Date()
    }).save();

    //console.log('New Expense ID:', newExpense._id.toString()); // Log new expense ID as string

    const res = await request(app)
      .put(`/expenses/${newExpense._id.toString()}`) // Convert ObjectId to string
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Updated Expense',
        amount: 150
      });

    //console.log('Update Response:', res.body); // Log update response

    expect(res.statusCode).toEqual(200);
    expect(res.body.description).toBe('Updated Expense');
    expect(res.body.amount).toBe(150);
  });

  it('should delete an expense', async () => {
    const newExpense = await new Expense({
      userId: new mongoose.Types.ObjectId(userId), // Ensure the userId is an ObjectId
      description: 'Test Expense',
      amount: 100,
      date: new Date()
    }).save();

    //console.log('Expense to Delete ID:', newExpense._id.toString()); // Log expense ID to delete as string

    const res = await request(app)
      .delete(`/expenses/${newExpense._id.toString()}`) // Convert ObjectId to string
      .set('Authorization', `Bearer ${token}`);

    //console.log('Delete Response:', res.body); // Log delete response

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Expense deleted successfully');
  });
});
