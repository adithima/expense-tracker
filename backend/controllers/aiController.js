const { askAI } = require('../services/aiClient');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const buildUserContext = async (userId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: start } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  const lastMonth = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: lastMonthStart, $lt: start } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);

  const budgets = await Budget.find({ user: userId, isActive: true });

  return {
    thisMonth: thisMonth.map(t => `${t._id}: ₹${t.total}`).join(', ') || 'no expenses yet',
    lastMonth: lastMonth.map(t => `${t._id}: ₹${t.total}`).join(', ') || 'no data',
    budgets: budgets.map(b => `${b.isOverall ? 'Overall' : b.category}: limit ₹${b.limitAmount}`).join(', ') || 'no budgets set',
  };
};

const askAboutSpending = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const ctx = await buildUserContext(req.user._id);

    const systemPrompt = `You are a budgeting assistant inside an expense tracker app.
You will be given the user's real spending data and a question.
Answer using ONLY the data provided — never invent numbers.
If asked how to reduce expenses, name 1-2 specific categories from the data and one concrete action each.
If the data needed to answer isn't available, say so plainly instead of guessing.
Keep the answer under 60 words. No markdown, no greetings.`;

    const userMessage = `This month's expenses by category: ${ctx.thisMonth}
Last month's expenses by category: ${ctx.lastMonth}
Active budgets: ${ctx.budgets}

Question: ${question}`;

    const answer = await askAI(systemPrompt, userMessage);
    res.json({ answer });
  } catch (err) { next(err); }
};

module.exports = { askAboutSpending };