const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true, validate: {
    validator: function(value) {
      // `this` is the document being validated
      return value >= this.startDate;
    },
    message: 'End date must be equal to or later than start date'
  }}
});

module.exports = mongoose.model('Budget', budgetSchema);
