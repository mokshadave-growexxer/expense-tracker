const Expense = require('../models/Expense');
const axios = require('axios');

// @desc  AI expense analysis using OpenRouter (free tier)
// @route POST /api/ai/analyze-expenses
const analyzeExpenses = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startOfMonth },
    }).sort('-date');

    if (!expenses.length)
      return res.json({ analysis: 'No expenses found for this month to analyze.' });

    // Build summary for prompt
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const categoryLines = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `  - ${cat}: ₹${amt.toFixed(2)}`)
      .join('\n');
    const recentLines = expenses
      .slice(0, 10)
      .map((e) => `  - ${e.title} (${e.category}): ₹${e.amount}`)
      .join('\n');

    const prompt = `You are a personal finance advisor. Analyze the following expense data for this month and give a concise, practical response.

Total spent: ₹${total.toFixed(2)}
Number of transactions: ${expenses.length}

Spending by category:
${categoryLines}

Recent transactions:
${recentLines}

Please provide:
1. A brief spending summary (2-3 sentences)
2. The biggest spending category and whether it's concerning
3. Three specific, actionable suggestions to reduce expenses
4. One positive observation if applicable

Keep the response friendly, concise, and practical. Use bullet points where appropriate.`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Fallback: generate basic analysis without AI
      const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
      return res.json({
        analysis: `📊 **This Month's Summary**\n\nYou've spent ₹${total.toFixed(2)} across ${expenses.length} transactions this month.\n\n🏆 **Biggest Category:** ${topCategory?.[0] || 'N/A'} at ₹${topCategory?.[1]?.toFixed(2) || 0} (${topCategory ? ((topCategory[1] / total) * 100).toFixed(0) : 0}% of total spending).\n\n💡 **Quick Tips:**\n• Review your ${topCategory?.[0]} spending — it's your largest expense category\n• Set a monthly budget limit to track overspending\n• Consider tracking daily to catch patterns early\n\n_Configure OPENROUTER_API_KEY in .env for full AI-powered insights._`,
        source: 'basic',
      });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
          'X-Title': 'FinTrack Expense Analyzer',
        },
        timeout: 20000,
      }
    );

    const analysis = response.data?.choices?.[0]?.message?.content || 'Could not generate analysis.';
    res.json({ analysis, source: 'ai' });
  } catch (error) {
    console.error('AI analysis error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'AI analysis failed. Please try again later.' });
  }
};

module.exports = { analyzeExpenses };