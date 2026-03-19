const Expense = require('../models/Expense');
const Income = require('../models/Income');
const axios = require('axios');

// Helper to extract amount from text
function extractAmount(text) {
  const matches = text.match(/(?:rs\.?\s*|₹\s*|inr\s*)?(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i);
  if (matches) {
    return parseFloat(matches[1].replace(/,/g, ''));
  }
  return null;
}

// Helper to extract category for expenses
function extractCategory(text) {
  const categories = ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'others'];
  const textLower = text.toLowerCase();
  
  // Category keywords
  const keywords = {
    food: ['food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'groceries', 'grocery', 'meal', 'snacks', 'pizza', 'burger', 'coffee', 'tea', 'cafe'],
    transport: ['transport', 'uber', 'ola', 'taxi', 'cab', 'bus', 'train', 'metro', 'fuel', 'petrol', 'diesel', 'gas', 'parking', 'toll'],
    shopping: ['shopping', 'clothes', 'apparel', 'amazon', 'flipkart', 'online', 'purchase', 'electronics', 'gadget'],
    bills: ['bill', 'electricity', 'water', 'gas', 'internet', 'wifi', 'phone', 'mobile', 'recharge', 'rent', 'maintenance'],
    entertainment: ['movie', 'netflix', 'prime', 'hotstar', 'theatre', 'concert', 'game', 'sports', 'party', 'club'],
    health: ['health', 'medical', 'doctor', 'hospital', 'medicine', 'pharmacy', 'clinic', 'gym', 'fitness', 'lab'],
    others: ['other', 'misc', 'miscellaneous']
  };
  
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(word => textLower.includes(word))) {
      return cat;
    }
  }
  
  return 'others';
}

// Helper to extract source for income
function extractSource(text) {
  const textLower = text.toLowerCase();
  
  const sources = {
    salary: ['salary', 'paycheck', 'wage', 'income', 'earning'],
    freelance: ['freelance', 'contract', 'gig', 'project'],
    business: ['business', 'profit', 'revenue', 'sale'],
    investment: ['investment', 'dividend', 'stock', 'interest', 'profit'],
    gift: ['gift', 'present', 'received'],
    refund: ['refund', 'cashback', 'return'],
    other: ['other', 'misc']
  };
  
  for (const [src, words] of Object.entries(sources)) {
    if (words.some(word => textLower.includes(word))) {
      return src.charAt(0).toUpperCase() + src.slice(1);
    }
  }
  
  return 'Other';
}

// Helper to extract date
function extractDate(text) {
  const today = new Date();
  
  // Check for "today"
  if (text.toLowerCase().includes('today')) {
    return today;
  }
  
  // Check for "yesterday"
  if (text.toLowerCase().includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  
  // Check for specific date formats (dd/mm/yyyy, dd-mm-yyyy)
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dateMatch) {
    const [_, day, month, year] = dateMatch;
    return new Date(year, month - 1, day);
  }
  
  // Check for "on [day]" (e.g., "on Monday")
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (text.toLowerCase().includes(`on ${days[i]}`)) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysToSubtract = currentDay - targetDay;
      if (daysToSubtract < 0) daysToSubtract += 7;
      const date = new Date(today);
      date.setDate(date.getDate() - daysToSubtract);
      return date;
    }
  }
  
  return today;
}

// @desc    Process AI chat commands (add income/expense, analyze, etc.)
// @route   POST /api/ai/chat
const processChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messageLower = message.toLowerCase();

    // ========== COMMAND 1: ADD INCOME ==========
    if (messageLower.includes('add income') || messageLower.includes('add salary') || 
        messageLower.includes('add money') || (messageLower.includes('income') && messageLower.includes('from'))) {
      
      const amount = extractAmount(message);
      if (!amount) {
        return res.json({
          action: 'error',
          response: '❌ I couldn\'t detect the amount. Please specify like: "Add income ₹5000 from freelance"'
        });
      }

      const source = extractSource(message);
      const date = extractDate(message);
      const description = message;

      const income = await Income.create({
        source,
        amount,
        date,
        description,
        userId
      });

      return res.json({
        action: 'add_income',
        message: `✅ Added ₹${amount.toLocaleString('en-IN')} as income from ${source}`,
        response: `✅ Done! I've added ₹${amount.toLocaleString('en-IN')} as income from ${source} on ${date.toLocaleDateString('en-IN')}.`,
        data: income
      });
    }

    // ========== COMMAND 2: ADD EXPENSE ==========
    if (messageLower.includes('add expense') || messageLower.includes('spent') || 
        messageLower.includes('paid') || messageLower.includes('bought') || 
        messageLower.includes('purchased') || messageLower.includes('expense')) {
      
      const amount = extractAmount(message);
      if (!amount) {
        return res.json({
          action: 'error',
          response: '❌ I couldn\'t detect the amount. Please specify like: "Spent ₹200 on food" or "Add expense ₹500 for groceries"'
        });
      }

      // Extract title (what was spent on)
      let title = 'Expense';
      const onMatch = message.match(/(?:on|for|at)\s+([a-zA-Z\s]+?)(?:\s+(?:today|yesterday|on|\d|$))/i);
      if (onMatch) {
        title = onMatch[1].trim();
      } else {
        // Try to get the first few words after the amount
        const afterAmount = message.split(amount.toString())[1]?.trim() || '';
        if (afterAmount) {
          title = afterAmount.split(/\s+/).slice(0, 3).join(' ');
        }
      }

      const category = extractCategory(message);
      const date = extractDate(message);
      const description = message;

      const expense = await Expense.create({
        title,
        amount,
        category,
        date,
        description,
        userId
      });

      return res.json({
        action: 'add_expense',
        message: `✅ Added ₹${amount.toLocaleString('en-IN')} expense for ${title} (${category})`,
        response: `✅ Got it! I've added ₹${amount.toLocaleString('en-IN')} for "${title}" in the ${category} category on ${date.toLocaleDateString('en-IN')}.`,
        data: expense
      });
    }

    // ========== COMMAND 3: SHOW EXPENSES/INCOME ==========
    if (messageLower.includes('show') || messageLower.includes('list') || 
        messageLower.includes('display') || messageLower.includes('get')) {
      
      // Check if user wants expenses or income
      if (messageLower.includes('expense') || messageLower.includes('spending') || messageLower.includes('spent')) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const expenses = await Expense.find({
          userId,
          date: { $gte: startOfMonth }
        }).sort('-date').limit(10);

        if (!expenses.length) {
          return res.json({
            action: 'info',
            response: '📭 You have no expenses recorded this month.'
          });
        }

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const expenseList = expenses.map(e => 
          `  • ₹${e.amount.toLocaleString('en-IN')} - ${e.title} (${e.category}) on ${new Date(e.date).toLocaleDateString('en-IN')}`
        ).join('\n');

        return res.json({
          action: 'show_expenses',
          response: `📊 **Your Expenses This Month**\n\nTotal: ₹${total.toLocaleString('en-IN')}\n\nRecent transactions:\n${expenseList}`
        });
      }

      if (messageLower.includes('income') || messageLower.includes('earned') || messageLower.includes('received')) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const incomes = await Income.find({
          userId,
          date: { $gte: startOfMonth }
        }).sort('-date').limit(10);

        if (!incomes.length) {
          return res.json({
            action: 'info',
            response: '📭 You have no income recorded this month.'
          });
        }

        const total = incomes.reduce((sum, i) => sum + i.amount, 0);
        const incomeList = incomes.map(i => 
          `  • ₹${i.amount.toLocaleString('en-IN')} - ${i.source} on ${new Date(i.date).toLocaleDateString('en-IN')}`
        ).join('\n');

        return res.json({
          action: 'show_income',
          response: `💰 **Your Income This Month**\n\nTotal: ₹${total.toLocaleString('en-IN')}\n\nRecent entries:\n${incomeList}`
        });
      }
    }

    // ========== COMMAND 4: ANALYZE EXPENSES (use existing function) ==========
    if (messageLower.includes('analyze') || messageLower.includes('analysis') || 
        messageLower.includes('insights') || messageLower.includes('summary')) {
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const expenses = await Expense.find({
        userId,
        date: { $gte: startOfMonth },
      }).sort('-date');

      if (!expenses.length) {
        return res.json({
          action: 'info',
          response: '📭 No expenses found for this month to analyze.'
        });
      }

      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const byCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});

      const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
      const topCategoryPercent = topCategory ? ((topCategory[1] / total) * 100).toFixed(0) : 0;

      const analysis = `📊 **Spending Analysis for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}**

**Summary:**
You've spent ₹${total.toLocaleString('en-IN')} across ${expenses.length} transactions.

**By Category:**
${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => 
  `  • ${cat}: ₹${amt.toLocaleString('en-IN')} (${((amt/total)*100).toFixed(0)}%)`
).join('\n')}

**Insights:**
• Biggest spending: ${topCategory?.[0] || 'N/A'} (${topCategoryPercent}% of total)
• Average per transaction: ₹${(total/expenses.length).toLocaleString('en-IN')}

**Suggestions:**
• Set a monthly budget to track your spending
• Review ${topCategory?.[0] || 'your'} expenses — it's your largest category
• Try to save at least 20% of your income each month`;

      return res.json({
        action: 'analyze',
        response: analysis
      });
    }

    // ========== DEFAULT: Use AI for general conversation ==========
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.json({
        action: 'info',
        response: "I can help you add income/expenses, show your transactions, or analyze your spending. Try commands like:\n• 'Add income ₹5000 from freelance'\n• 'Spent ₹200 on food today'\n• 'Show my expenses'\n• 'Analyze my spending'"
      });
    }

    // Get some context for the AI
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({ userId, date: { $gte: startOfMonth } }).limit(5);
    const incomes = await Income.find({ userId, date: { $gte: startOfMonth } }).limit(5);
    
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const incomeTotal = incomes.reduce((s, i) => s + i.amount, 0);

    const context = `You are a helpful finance assistant for FinTrack app. The user has:
- This month's expenses total: ₹${expenseTotal.toLocaleString('en-IN')}
- This month's income total: ₹${incomeTotal.toLocaleString('en-IN')}
- Recent expenses: ${expenses.map(e => `${e.title} (₹${e.amount})`).join(', ')}
- Recent income: ${incomes.map(i => `${i.source} (₹${i.amount})`).join(', ')}

You can help them add transactions, show data, or give financial advice. Be concise and friendly.`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
          'X-Title': 'FinTrack AI Assistant',
        },
        timeout: 15000,
      }
    );

    const aiResponse = response.data?.choices?.[0]?.message?.content || 
      "I'm not sure how to help with that. Try asking me to add an expense or show your transactions.";

    return res.json({
      action: 'chat',
      response: aiResponse
    });

  } catch (error) {
    console.error('AI chat error:', error?.response?.data || error.message);
    res.status(500).json({ 
      message: 'AI processing failed',
      response: 'Sorry, I encountered an error. Please try again.' 
    });
  }
};

module.exports = { processChat };