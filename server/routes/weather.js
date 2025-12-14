const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/hourly', async (req,res) => {
  try {
    const { lat, lon } = req.query;
    if (!process.env.OPENWEATHER_KEY) return res.status(500).json({ error: 'No weather key' });
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&units=metric&appid=${process.env.OPENWEATHER_KEY}`;
    const r = await axios.get(url);
    // return hourly array (next 48 hours)
    res.json({ hourly: r.data.hourly, current: r.data.current, timezone: r.data.timezone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;