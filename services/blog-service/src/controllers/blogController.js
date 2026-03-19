const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const logger = require('../utils/logger');

// Mock blog data
const mockBlogs = [
  {
    id: '1',
    slug: 'beginners-guide-to-stock-market-investing',
    title: "Beginner's Guide to Stock Market Investing",
    excerpt: 'Learn the basics of stock market investing and start your journey to financial freedom.',
    content: `
# Introduction to Stock Market Investing

The stock market can seem intimidating to beginners, but understanding the basics can help you make informed investment decisions.

## What is the Stock Market?

The stock market is a collection of exchanges where stocks (pieces of ownership in businesses) are bought and sold. When you buy a stock, you're buying a small piece of that company.

## Key Terms to Know

- **Stock**: A share of ownership in a company
- **Bull Market**: A market condition where prices are rising
- **Bear Market**: A market condition where prices are falling
- **Portfolio**: Your collection of investments
- **Dividend**: A portion of company profits paid to shareholders

## Getting Started

1. **Set Investment Goals**: Determine what you want to achieve
2. **Build an Emergency Fund**: Have 3-6 months of expenses saved
3. **Start with Index Funds**: Low-cost way to diversify
4. **Invest Regularly**: Use SIP for consistent investing
5. **Stay Patient**: Long-term investing typically yields better results

## Common Mistakes to Avoid

- Investing money you can't afford to lose
- Trying to time the market
- Not diversifying your portfolio
- Making emotional decisions
- Ignoring fees and expenses

Remember, successful investing is a marathon, not a sprint.
    `,
    category: 'investing',
    author: { name: 'Rahul Sharma', avatar: 'https://example.com/avatar1.jpg' },
    imageUrl: 'https://example.com/stock-market-guide.jpg',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readTime: 8,
    tags: ['Investing', 'Stocks', 'Beginners', 'Finance'],
    likes: 245,
    views: 1520,
    featured: true
  },
  {
    id: '2',
    slug: 'understanding-mutual-funds-complete-guide',
    title: 'Understanding Mutual Funds: A Complete Guide',
    excerpt: 'Everything you need to know about mutual funds and how to select the right ones for your portfolio.',
    content: `
# Complete Guide to Mutual Funds

Mutual funds are one of the most popular investment vehicles in India, offering diversification and professional management.

## What are Mutual Funds?

A mutual fund pools money from multiple investors to invest in stocks, bonds, and other securities. Professional fund managers handle the investment decisions.

## Types of Mutual Funds

### Equity Funds
- Large Cap Funds
- Mid Cap Funds
- Small Cap Funds
- Multi Cap Funds

### Debt Funds
- Liquid Funds
- Short Duration Funds
- Corporate Bond Funds
- Gilt Funds

### Hybrid Funds
- Balanced Funds
- Aggressive Hybrid Funds
- Conservative Hybrid Funds

## How to Select Mutual Funds

1. Define your investment goals
2. Assess your risk tolerance
3. Check fund performance
4. Review expense ratio
5. Look at fund manager track record
6. Diversify across fund types

## SIP vs Lumpsum

**SIP (Systematic Investment Plan)**
- Invest fixed amount regularly
- Benefits from rupee cost averaging
- Good for beginners

**Lumpsum**
- One-time investment
- Better when markets are low
- Requires market timing skills

Start your mutual fund journey today!
    `,
    category: 'mutual-funds',
    author: { name: 'Priya Patel', avatar: 'https://example.com/avatar2.jpg' },
    imageUrl: 'https://example.com/mutual-funds-guide.jpg',
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    readTime: 10,
    tags: ['Mutual Funds', 'SIP', 'Investment', 'Finance'],
    likes: 189,
    views: 1234,
    featured: true
  },
  {
    id: '3',
    slug: 'tax-saving-investments-80c-deductions',
    title: 'Tax Saving Investments Under Section 80C',
    excerpt: 'Maximize your tax savings with these investment options under Section 80C of the Income Tax Act.',
    content: `
# Tax Saving Investments Under Section 80C

Section 80C of the Income Tax Act allows deductions up to Rs 1.5 lakh for specified investments and expenses.

## Popular 80C Investment Options

### 1. ELSS (Equity Linked Savings Scheme)
- Lock-in period: 3 years (shortest)
- Potential for high returns
- Tax-free returns under LTCG exemption

### 2. PPF (Public Provident Fund)
- Lock-in period: 15 years
- Current interest rate: 7.1%
- Tax-free returns

### 3. NSC (National Savings Certificate)
- Lock-in period: 5 years
- Fixed interest rate
- Interest is taxable

### 4. Tax Saver Fixed Deposits
- Lock-in period: 5 years
- Safe investment option
- Interest is taxable

### 5. Life Insurance Premiums
- Provides life cover
- Maturity benefits may be tax-free
- Choose term insurance for pure protection

## Comparison Table

| Investment | Lock-in | Returns | Risk |
|------------|---------|---------|------|
| ELSS | 3 years | 12-15% | High |
| PPF | 15 years | 7.1% | Low |
| NSC | 5 years | 7.7% | Low |
| FD | 5 years | 6-7% | Low |

Choose wisely based on your financial goals!
    `,
    category: 'tax-planning',
    author: { name: 'Amit Kumar', avatar: 'https://example.com/avatar3.jpg' },
    imageUrl: 'https://example.com/tax-saving.jpg',
    publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    readTime: 7,
    tags: ['Tax Saving', '80C', 'ELSS', 'PPF', 'Finance'],
    likes: 312,
    views: 2100,
    featured: false
  },
  {
    id: '4',
    slug: 'retirement-planning-guide-india',
    title: 'Complete Retirement Planning Guide for Indians',
    excerpt: 'Plan your retirement effectively with this comprehensive guide tailored for Indian investors.',
    content: `
# Retirement Planning Guide for Indians

Planning for retirement is crucial to ensure financial independence in your golden years.

## Why Retirement Planning is Important

- Increasing life expectancy
- Rising healthcare costs
- Inflation eroding purchasing power
- Desire for comfortable retirement

## Retirement Planning Steps

### Step 1: Calculate Your Retirement Corpus
Use the formula: Monthly Expenses × 12 × 25 (for 25 years)
Adjust for inflation

### Step 2: Choose Investment Vehicles
- NPS (National Pension System)
- EPF (Employee Provident Fund)
- PPF (Public Provident Fund)
- Mutual Funds
- Real Estate

### Step 3: Start Early
The power of compounding works best over long periods.

**Example:**
- Start at 25: Invest Rs 5,000/month → Rs 1.9 Crore at 60
- Start at 35: Invest Rs 5,000/month → Rs 75 Lakhs at 60
(Assuming 12% returns)

## NPS vs EPF vs PPF

| Feature | NPS | EPF | PPF |
|---------|-----|-----|-----|
| Returns | 8-10% | 8.15% | 7.1% |
| Tax Benefit | 80C + 80CCD | 80C | 80C |
| Lock-in | Till 60 | Service | 15 years |
| Withdrawal | Partial | Limited | After 6 years |

Start planning today for a secure tomorrow!
    `,
    category: 'retirement',
    author: { name: 'Deepak Verma', avatar: 'https://example.com/avatar4.jpg' },
    imageUrl: 'https://example.com/retirement-planning.jpg',
    publishedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    readTime: 12,
    tags: ['Retirement', 'NPS', 'EPF', 'Financial Planning'],
    likes: 278,
    views: 1890,
    featured: true
  },
  {
    id: '5',
    slug: 'cryptocurrency-investing-india',
    title: 'Cryptocurrency Investing in India: What You Need to Know',
    excerpt: 'Navigate the world of cryptocurrency investments in India with this detailed guide.',
    content: `
# Cryptocurrency Investing in India

Cryptocurrency has gained significant attention in India. Here's what you need to know before investing.

## Understanding Cryptocurrency

Cryptocurrency is a digital or virtual currency that uses cryptography for security and operates on blockchain technology.

## Popular Cryptocurrencies

1. **Bitcoin (BTC)**: The first and largest cryptocurrency
2. **Ethereum (ETH)**: Smart contract platform
3. **Ripple (XRP)**: Focus on banking transactions
4. **Cardano (ADA)**: Research-driven blockchain
5. **Polygon (MATIC)**: Indian-origin scaling solution

## Crypto Taxation in India

- 30% tax on crypto gains (no deductions except purchase cost)
- 1% TDS on transactions above Rs 10,000
- Losses cannot be offset against other income

## How to Invest in Crypto

1. Choose a reliable exchange (WazirX, CoinDCX, etc.)
2. Complete KYC verification
3. Start with small amounts
4. Use hardware wallets for security
5. Never invest more than you can afford to lose

## Risks to Consider

- High volatility
- Regulatory uncertainty
- Security risks
- Market manipulation

Invest cautiously and do your research!
    `,
    category: 'cryptocurrency',
    author: { name: 'Neha Singh', avatar: 'https://example.com/avatar5.jpg' },
    imageUrl: 'https://example.com/crypto-india.jpg',
    publishedAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    readTime: 9,
    tags: ['Cryptocurrency', 'Bitcoin', 'Blockchain', 'Digital Assets'],
    likes: 156,
    views: 980,
    featured: false
  }
];

const categories = [
  { id: 'investing', name: 'Investing', count: 15 },
  { id: 'mutual-funds', name: 'Mutual Funds', count: 12 },
  { id: 'tax-planning', name: 'Tax Planning', count: 8 },
  { id: 'retirement', name: 'Retirement', count: 6 },
  { id: 'cryptocurrency', name: 'Cryptocurrency', count: 5 },
  { id: 'personal-finance', name: 'Personal Finance', count: 10 },
  { id: 'insurance', name: 'Insurance', count: 7 },
  { id: 'real-estate', name: 'Real Estate', count: 4 }
];

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    let blogs = [...mockBlogs];
    
    if (sort === 'popular') {
      blogs.sort((a, b) => b.views - a.views);
    } else if (sort === 'mostLiked') {
      blogs.sort((a, b) => b.likes - a.likes);
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedBlogs = blogs.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      blogs: paginatedBlogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: blogs.length,
        pages: Math.ceil(blogs.length / limit)
      }
    });
  } catch (error) {
    logger.error(`Get all blogs error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    res.json({ categories });
  } catch (error) {
    logger.error(`Get categories error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Search blogs
exports.searchBlogs = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const searchLower = q.toLowerCase();
    const results = mockBlogs.filter(b => 
      b.title.toLowerCase().includes(searchLower) ||
      b.excerpt.toLowerCase().includes(searchLower) ||
      b.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
    
    const startIndex = (page - 1) * limit;
    const paginatedBlogs = results.slice(startIndex, startIndex + parseInt(limit));
    
    logger.info(`Blog search performed: ${q}`);
    
    res.json({
      blogs: paginatedBlogs,
      query: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length,
        pages: Math.ceil(results.length / limit)
      }
    });
  } catch (error) {
    logger.error(`Search blogs error: ${error.message}`);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get featured blogs
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const featured = mockBlogs.filter(b => b.featured);
    res.json({ blogs: featured, count: featured.length });
  } catch (error) {
    logger.error(`Get featured blogs error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch featured blogs' });
  }
};

// Get blogs by category
exports.getBlogsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const blogs = mockBlogs.filter(b => b.category === category);
    
    const startIndex = (page - 1) * limit;
    const paginatedBlogs = blogs.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      blogs: paginatedBlogs,
      category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: blogs.length,
        pages: Math.ceil(blogs.length / limit)
      }
    });
  } catch (error) {
    logger.error(`Get blogs by category error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Get blog by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = mockBlogs.find(b => b.slug === slug);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Get related blogs
    const related = mockBlogs
      .filter(b => b.slug !== slug && b.category === blog.category)
      .slice(0, 3);
    
    res.json({ blog, related });
  } catch (error) {
    logger.error(`Get blog by slug error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// Like blog
exports.likeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const blog = mockBlogs.find(b => b.id === id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // In production, track likes in database
    blog.likes += 1;
    
    logger.info(`Blog liked: ${id} by user ${userId}`);
    res.json({ message: 'Blog liked', likes: blog.likes });
  } catch (error) {
    logger.error(`Like blog error: ${error.message}`);
    res.status(500).json({ error: 'Failed to like blog' });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    const { content } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!content || content.trim().length < 2) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const blog = mockBlogs.find(b => b.id === id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    const comment = await Comment.create({
      blogId: id,
      userId,
      content: content.trim()
    });
    
    logger.info(`Comment added to blog: ${id} by user ${userId}`);
    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    logger.error(`Add comment error: ${error.message}`);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get comments
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const comments = await Comment.find({ blogId: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Comment.countDocuments({ blogId: id });
    
    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get comments error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};
