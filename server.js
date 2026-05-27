require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getStickers } = require('./lib/stickers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname)));

app.get('/api/stickers', async (req, res) => {
    try {
        const refresh = req.query.refresh === '1';
        const data = await getStickers(refresh);
        res.json(data);
    } catch (err) {
        console.error('Cloudinary error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`aibe server running at http://localhost:${PORT}`);
});

server.on('error', err => {
    console.error('Server error:', err.message);
    process.exit(1);
});
