const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve all original static files exactly as they are
app.use(express.static(path.join(__dirname)));

// ==================== API (свои) ====================
app.get('/api/live', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, user: "xX_Dark_Pro_Xx", item: "AK-47 | Redline", price: 1240 },
      { id: 2, user: "S1mpleGOD", item: "AWP | Dragon Lore", price: 8750 }
    ]
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    users_online: 87452,
    cases_opened_today: 124589,
    total_won: 124578902
  });
});

app.get('/api/cases', (req, res) => {
  res.json({
    success: true,
    cases: [
      { id: 1, name: "Premium Case", price: 500 },
      { id: 2, name: "Legendary Case", price: 1500 }
    ]
  });
});

app.get('/api/user', (req, res) => {
  res.json({
    success: true,
    balance: 12450,
    username: "Player"
  });
});

// ==================== TRANSLATIONS ====================
app.get('/locales/ru/translation.json', (req, res) => {
  res.json({
    header: {
      cases: "Кейсы",
      battles: "Баттлы",
      contracts: "Контракты",
      upgrades: "Апгрейды",
      giveaways: "Розыгрыши"
    },
    meta: {
      main: {
        title: "Кейсы КС2 - Открыть кейсы CS2 (CS:GO) на GGDROP"
      }
    },
    welcome: "Добро пожаловать на GGDROP"
  });
});

// ==================== AUDIO (чтобы не было 404) ====================
app.get('/audio/*', (req, res) => {
  res.status(204).send();
});

// ==================== START ====================
app.listen(PORT, () => {
  console.log(`✅ GGDROP Exact запущен!`);
  console.log(`Открой в браузере: http://localhost:${PORT}`);
});