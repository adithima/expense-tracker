
const { askAI } = require('../services/aiClient');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const buildUserContext = async (userId) => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const allTimeResult = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const thisMonth = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        date: { $gte: start },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const lastMonth = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        date: { $gte: lastMonthStart, $lt: start },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const budgets = await Budget.find({
    user: userId,
    isActive: true,
  });

  return {
    allTimeTotal: allTimeResult[0]?.total || 0,

    thisMonth:
      thisMonth
        .map((item) => `${item._id}: ₹${item.total}`)
        .join(', ') || 'no expenses yet',

    lastMonth:
      lastMonth
        .map((item) => `${item._id}: ₹${item.total}`)
        .join(', ') || 'no expenses',

    budgets:
      budgets
        .map(
          (budget) =>
            `${budget.isOverall ? 'Overall' : budget.category}: limit ₹${budget.limitAmount}`
        )
        .join(', ') || 'no budgets set',
  };
};

const askAboutSpending = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (
      typeof question !== 'string' ||
      !question.trim()
    ) {
      return res.status(400).json({
        message: 'Question is required',
      });
    }

    const ctx = await buildUserContext(req.user._id);

    const systemPrompt = `
You are a helpful budgeting assistant inside an expense tracker app.

Use only the user's supplied spending data.
Never invent amounts or claim information that is unavailable.
All-time total means total expenses across all recorded transactions.
Monthly category totals are category breakdowns, not necessarily all-time totals.
If asked how to reduce expenses, suggest one or two specific categories
and a practical action for each.
If the available data cannot answer a question, say so clearly.
Keep answers under 60 words.
Use simple language and no greetings.
Amounts are in Indian rupees (₹).
`.trim();

    const userMessage = `
All-time total expenses: ₹${ctx.allTimeTotal}

This month's expenses by category:
${ctx.thisMonth}

Last month's expenses by category:
${ctx.lastMonth}

Active budgets:
${ctx.budgets}

User's question:
${question.trim()}
`.trim();

    const answer = await askAI(systemPrompt, userMessage);

    return res.json({ answer });
  } catch (err) {
    // Diagnostic details appear in your server logs, not the user's response.
    console.error('AI spending assistant error:', err);
    return next(err);
  }
};

module.exports = { askAboutSpending };
