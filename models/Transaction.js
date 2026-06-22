const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);