const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));

// === API ===
app.get('/api/live', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/stats', (req, res) => {
  res.json({ success: true, users: 124587, cases: 892341 });
});

app.get('/api/cases', (req, res) => {
  res.json({ success: true, cases: [] });
});

// === Переводы ===
app.get('/locales/ru/translation.json', (req, res) => {
  res.json({});
});

// === Аудио (чтобы не было 404) ===
app.get('/audio/*', (req, res) => res.status(204).send());

// === Запуск ===
app.listen(PORT, () => {
  console.log(`✅ GGDROP запущен: http://localhost:${PORT}`);
});