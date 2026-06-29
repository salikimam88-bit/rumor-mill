const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Seed rumors pool
const SEED_RUMORS = [
  {
    id: 1,
    text: "The library basement has a secret 5th floor that only opens at 3:33 AM, and the books there rewrite themselves every full moon.",
    date: "2026-06-29"
  },
  {
    id: 2,
    text: "The campus squirrel population is actually a surveillance network trained by the biology department.",
    date: "2026-06-28"
  },
  {
    id: 3,
    text: "The campus WiFi slows down because it's secretly mining cryptocurrency using student laptops.",
    date: "2026-06-27"
  },
  {
    id: 4,
    text: "The dining hall uses the same 5 ingredients for every meal, just rearranged.",
    date: "2026-06-26"
  },
  {
    id: 5,
    text: "The campus bus route forms a pentagram when mapped, and the driver who completes the most loops gets a mysterious bonus.",
    date: "2026-06-25"
  },
  {
    id: 6,
    text: "The campus fountain water is actually recycled from the chemistry lab, which explains why the ducks look so focused.",
    date: "2026-06-24"
  },
  {
    id: 7,
    text: "The elevator in the science building skips floor 7 because something happened there in 1997 that the administration buried.",
    date: "2026-06-23"
  },
  {
    id: 8,
    text: "The campus bookstore has a 'banned books' section in the basement that only appears if you ask for 'the special catalog.'",
    date: "2026-06-22"
  },
  {
    id: 9,
    text: "The campus clock tower is 3 minutes fast on purpose — it's a social experiment to see if anyone will actually say something.",
    date: "2026-06-21"
  },
  {
    id: 10,
    text: "The vending machine in the engineering building dispenses a 'mystery item' at exactly 2:47 AM if you press all buttons simultaneously.",
    date: "2026-06-20"
  }
];

// Initialize or load data
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  return {
    currentSeed: getTodaySeed(),
    posts: [],
    votes: {},
    hallOfFame: [],
    lastResetDate: getTodayString()
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getTodaySeed() {
  const today = getTodayString();
  // Use date to deterministically pick a seed
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % SEED_RUMORS.length;
  return { ...SEED_RUMORS[index], activeDate: today };
}

function checkAndReset(data) {
  const today = getTodayString();
  if (data.lastResetDate !== today) {
    // Archive winners from yesterday
    const yesterdayPosts = data.posts.filter(p => p.date === data.lastResetDate);
    const yesterdaySpreads = yesterdayPosts.filter(p => p.type === 'spread').sort((a, b) => b.votes - a.votes);
    const yesterdayDebunks = yesterdayPosts.filter(p => p.type === 'debunk').sort((a, b) => b.votes - a.votes);

    if (yesterdaySpreads.length > 0 || yesterdayDebunks.length > 0) {
      data.hallOfFame.unshift({
        date: data.lastResetDate,
        seed: data.currentSeed,
        bestSpread: yesterdaySpreads[0] || null,
        bestDebunk: yesterdayDebunks[0] || null
      });
      // Keep only last 30 days
      if (data.hallOfFame.length > 30) data.hallOfFame = data.hallOfFame.slice(0, 30);
    }

    // Reset for new day
    data.currentSeed = getTodaySeed();
    data.lastResetDate = today;
    data.votes = {};
    // Keep posts but they'll be filtered by date in responses
  }
  return data;
}

// Initialize data
let data = loadData();
data = checkAndReset(data);
saveData(data);

// ===== API ROUTES =====

// Get current seed and today's posts
app.get('/api/today', (req, res) => {
  data = checkAndReset(data);
  const today = getTodayString();
  const todayPosts = data.posts
    .filter(p => p.date === today)
    .sort((a, b) => b.votes - a.votes);

  res.json({
    seed: data.currentSeed,
    posts: todayPosts,
    countdown: getMidnightCountdown()
  });
});

// Submit a post (spread or debunk)
app.post('/api/post', (req, res) => {
  data = checkAndReset(data);
  const { type, text, author } = req.body;

  if (!type || !text || !['spread', 'debunk'].includes(type)) {
    return res.status(400).json({ error: 'Invalid post data' });
  }

  const post = {
    id: Date.now().toString(),
    type,
    text: text.trim().substring(0, 1000),
    author: (author || 'Anonymous').trim().substring(0, 30),
    votes: 0,
    date: getTodayString(),
    timestamp: Date.now()
  };

  data.posts.push(post);
  saveData(data);

  res.json({ success: true, post });
});

// Vote on a post
app.post('/api/vote', (req, res) => {
  data = checkAndReset(data);
  const { postId, voterId } = req.body;

  if (!postId || !voterId) {
    return res.status(400).json({ error: 'Missing postId or voterId' });
  }

  const voteKey = `${voterId}_${postId}`;
  const post = data.posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (data.votes[voteKey]) {
    // Remove vote
    post.votes = Math.max(0, post.votes - 1);
    delete data.votes[voteKey];
    saveData(data);
    return res.json({ success: true, voted: false, votes: post.votes });
  } else {
    // Add vote
    post.votes++;
    data.votes[voteKey] = true;
    saveData(data);
    return res.json({ success: true, voted: true, votes: post.votes });
  }
});

// Get Hall of Fame
app.get('/api/halloffame', (req, res) => {
  res.json({ hallOfFame: data.hallOfFame });
});

// Get timeline (posts in chronological order)
app.get('/api/timeline', (req, res) => {
  data = checkAndReset(data);
  const today = getTodayString();
  const timeline = data.posts
    .filter(p => p.date === today)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(p => ({
      time: new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: p.type,
      text: p.text.substring(0, 150) + (p.text.length > 150 ? '...' : '')
    }));

  res.json({ timeline });
});

// Get stats
app.get('/api/stats', (req, res) => {
  data = checkAndReset(data);
  const today = getTodayString();
  const todayPosts = data.posts.filter(p => p.date === today);

  res.json({
    totalPosts: todayPosts.length,
    totalSpreads: todayPosts.filter(p => p.type === 'spread').length,
    totalDebunks: todayPosts.filter(p => p.type === 'debunk').length,
    totalVotes: Object.keys(data.votes).length,
    activeViewers: Math.floor(Math.random() * 500) + 800 // Simulated for demo
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function getMidnightCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    totalMs: diff
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🔥 The Rumor Mill Server is running!`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /api/today         - Today's seed + posts`);
  console.log(`   POST /api/post          - Submit a post`);
  console.log(`   POST /api/vote          - Vote on a post`);
  console.log(`   GET  /api/halloffame    - Hall of Fame archive`);
  console.log(`   GET  /api/timeline      - Today's timeline`);
  console.log(`   GET  /api/stats         - Daily statistics`);
  console.log(`\n💾 Data stored in: ${DATA_FILE}\n`);
});
