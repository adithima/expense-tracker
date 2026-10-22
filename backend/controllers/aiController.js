const { askAI } = require('../services/aiClient');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const formatCategoryList = (rows) =>
  rows.map((r) => `${r._id}: ₹${r.total}`).join(', ') || 'none';

const buildUserContext = async (userId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  // All-time totals (income, expense) -> balance
  const allTimeTotals = await Transaction.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  const totalIncome = allTimeTotals.find((t) => t._id === 'income')?.total || 0;
  const totalExpense = allTimeTotals.find((t) => t._id === 'expense')?.total || 0;
  const currentBalance = totalIncome - totalExpense;

  // This month — expense by category, and income total
  const thisMonthExpense = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: start } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);
  const thisMonthIncomeResult = await Transaction.aggregate([
    { $match: { user: userId, type: 'income', date: { $gte: start } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const thisMonthIncome = thisMonthIncomeResult[0]?.total || 0;
  const thisMonthExpenseTotal = thisMonthExpense.reduce((sum, r) => sum + r.total, 0);

  // Last month — expense by category, and income total
  const lastMonthExpense = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: lastMonthStart, $lt: start } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);
  const lastMonthIncomeResult = await Transaction.aggregate([
    { $match: { user: userId, type: 'income', date: { $gte: lastMonthStart, $lt: start } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const lastMonthIncome = lastMonthIncomeResult[0]?.total || 0;
  const lastMonthExpenseTotal = lastMonthExpense.reduce((sum, r) => sum + r.total, 0);

  // Two months ago — expense by category only (gives the AI a 3-month trend to spot patterns)
  const twoMonthsAgoExpense = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: twoMonthsAgoStart, $lt: lastMonthStart } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  // Active budgets, with how much of each has actually been spent this month
  const budgets = await Budget.find({ user: userId, isActive: true });
  const budgetLines = await Promise.all(
    budgets.map(async (b) => {
      const match = {
        user: userId,
        type: 'expense',
        date: { $gte: start },
      };
      if (!b.isOverall) match.category = b.category;

      const spentResult = await Transaction.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const spent = spentResult[0]?.total || 0;
      const label = b.isOverall ? 'Overall' : b.category;
      return `${label}: ₹${spent} spent of ₹${b.limitAmount} limit`;
    })
  );

  return {
    totalIncome,
    totalExpense,
    currentBalance,
    thisMonthIncome,
    thisMonthExpenseTotal,
    thisMonthExpenseByCategory: formatCategoryList(thisMonthExpense),
    lastMonthIncome,
    lastMonthExpenseTotal,
    lastMonthExpenseByCategory: formatCategoryList(lastMonthExpense),
    twoMonthsAgoExpenseByCategory: formatCategoryList(twoMonthsAgoExpense),
    budgets: budgetLines.join(' | ') || 'no active budgets set',
  };
};

const askAboutSpending = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const ctx = await buildUserContext(req.user._id);

    const systemPrompt = `
You are Kharchup's built-in financial assistant. You help the user understand their spending,
track income, stay within budgets, and actively find ways to save money. You are not just a
lookup tool — act like a personal finance coach who knows this user's real numbers.

Rules:
- Use ONLY the data provided below. Never invent amounts, categories, or dates.
- If something is asked that the data doesn't cover (e.g. a specific future month, or a category
  with no transactions), say so plainly instead of guessing.
- When asked how to save money, reduce expenses, or hit a savings goal, look at the actual
  category breakdown and budgets given, name the 1-2 categories where spending is highest or has
  grown, and suggest one concrete, realistic action for each (not generic advice like "spend less").
- When asked about affordability ("can I afford X?"), compare the amount against current balance
  and/or the relevant budget's remaining room, and give a clear yes/no with the number behind it.
- When asked to compare months, use the month-by-month figures given, and say in plain terms
  whether spending went up or down and by how much.
- If a budget is close to or over its limit, mention it proactively when relevant to the question.
- Keep answers under 70 words. No greetings, no markdown, no bullet points — plain conversational text.
- All amounts are in Indian rupees (₹).
`.trim();

    const userMessage = `
All-time total income: ₹${ctx.totalIncome}
All-time total expense: ₹${ctx.totalExpense}
Current balance: ₹${ctx.currentBalance}

This month — income: ₹${ctx.thisMonthIncome}, total expense: ₹${ctx.thisMonthExpenseTotal}
This month — expense by category: ${ctx.thisMonthExpenseByCategory}

Last month — income: ₹${ctx.lastMonthIncome}, total expense: ₹${ctx.lastMonthExpenseTotal}
Last month — expense by category: ${ctx.lastMonthExpenseByCategory}

Two months ago — expense by category: ${ctx.twoMonthsAgoExpenseByCategory}

Active budgets and current usage: ${ctx.budgets}

User's question: ${question.trim()}
`.trim();

    const answer = await askAI(systemPrompt, userMessage);

    return res.json({ answer });
  } catch (err) {
    console.error('AI spending assistant error:', err);
    return next(err);
  }
};

module.exports = { askAboutSpending };