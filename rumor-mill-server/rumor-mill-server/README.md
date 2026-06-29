# 🔥 The Rumor Mill — Campus Controlled Chaos

A fun, engaging website where students collaboratively build and debunk absurd campus rumors. Every day, a new "seed rumor" drops. Students can either **spread it** (add fake details) or **debunk it** (post fake evidence). The community votes, and winners enter the Hall of Fame.

---

## 📁 Project Structure

```
rumor-mill-server/
├── package.json          # Dependencies
├── server.js             # Express backend
├── data.json             # Auto-created database file
└── public/
    └── index.html        # Frontend (connects to API)
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd rumor-mill-server
npm install
```

This installs:
- `express` — web server
- `cors` — cross-origin requests

### 2. Start the Server

```bash
npm start
```

The server will start on **http://localhost:3000**

### 3. Open in Browser

Go to **http://localhost:3000** — the website loads automatically.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/today` | Get today's seed rumor + all posts |
| POST | `/api/post` | Submit a spread or debunk |
| POST | `/api/vote` | Vote on a post (toggle) |
| GET | `/api/halloffame` | Get past winners |
| GET | `/api/timeline` | Get today's timeline |
| GET | `/api/stats` | Get daily statistics |
| GET | `/api/health` | Health check |

---

## 🎮 How It Works

### Daily Cycle

1. **Midnight** — New seed rumor automatically selected from the pool
2. **All Day** — Students submit spreads and debunks
3. **All Day** — Community votes on favorites
4. **Next Midnight** — Winners auto-archived to Hall of Fame, new day begins

### User Features

| Feature | How It Works |
|---------|-------------|
| **Submit Post** | Write text + optional name, choose spread or debunk |
| **Vote** | Click 🔥 or 🧪 button — toggles on/off |
| **Timeline** | Chronological view of how rumor evolved |
| **Hall of Fame** | Archive of past daily winners |
| **Countdown** | Live timer until winners announced |
| **Stats Bar** | Real-time spread/debunk/vote counts |

### Data Persistence

- **Server**: All posts, votes, and Hall of Fame stored in `data.json`
- **Browser**: User ID and vote history saved in `localStorage`
- **No login required** — anonymous participation

---

## 🛠️ Customization

### Add More Seed Rumors

Edit `server.js` and add to the `SEED_RUMORS` array:

```javascript
{
  id: 11,
  text: "Your custom rumor here...",
  date: "2026-06-19"
}
```

### Change Port

```bash
PORT=8080 npm start
```

### Reset Data

Simply delete `data.json` and restart the server. A fresh database will be created.

---

## 🌐 Deployment Options

### Free Options

| Platform | Steps |
|----------|-------|
| **Render** | Connect GitHub repo, auto-deploys |
| **Railway** | One-click deploy from repo |
| **Glitch** | Remix the project, instant hosting |
| **Vercel** | Use serverless adapter for Express |

### Self-Hosted

Run on any VPS (DigitalOcean, Linode, AWS EC2) with PM2:

```bash
npm install -g pm2
pm2 start server.js --name "rumor-mill"
pm2 save
```

---

## 🔒 Notes

- **No authentication** — uses browser fingerprinting for vote tracking
- **No profanity filter** — add one if needed for your campus
- **Data stored locally** — `data.json` is plain text, back it up regularly
- **10 pre-loaded rumors** — add more for longer rotation

---

Built with ❤️ for campus chaos. Spread responsibly.
