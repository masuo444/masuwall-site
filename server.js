const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// --- データベース設定 ---
const dbPath = path.join(__dirname, 'masu_status.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS masu_status (
            id TEXT PRIMARY KEY,
            is_available INTEGER DEFAULT 1
        )`);
    }
});

// --- ミドルウェア設定 ---
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // 静的ファイル（HTML, CSS, JS）の配信

// --- 簡易認証ミドルウェア (デモンストレーション用) ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password'; // 本番環境では絶対にハードコードしないでください

const authenticate = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (username && password && username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send('Authentication required.');
};

// --- APIエンドポイント ---

// 1. 全ての枡の販売状況を取得 (予約ページ用)
app.get('/api/masu-status', (req, res) => {
    db.all('SELECT id, is_available FROM masu_status', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. 管理画面から枡の販売状況を更新
app.post('/api/admin/update-masu-status', authenticate, (req, res) => {
    const { id, is_available } = req.body;
    if (!id || typeof is_available === 'undefined') {
        return res.status(400).json({ error: 'IDとis_availableは必須です。' });
    }

    db.run(
        'INSERT OR REPLACE INTO masu_status (id, is_available) VALUES (?, ?)',
        [id, is_available ? 1 : 0],
        function (err) {
            if (err) {
                console.error(`Error updating masu_status for ${id}:`, err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            console.log(`Masu ${id} updated to is_available: ${is_available}. Rows affected: ${this.changes}`);
            res.json({ message: '更新成功', id: id, is_available: is_available });
        }
    );
});

// --- サーバー起動 ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
