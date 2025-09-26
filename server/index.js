// 必要なライブラリをインポートする
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const cors = require('cors');

// Expressを使いサーバーを作成
const app = express();
app.use(cors()); // CORSを有効にする
app.use(express.json()); // JSON形式のリクエストを受信可能にする
app.use(express.urlencoded({ extended: true })); // Slackからのurlencoded形式も受信可能にする

// サーバーがリクエストを受けるポート番号設定
const PORT = 3001;

// データベースに接続
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// メッセージを保存するためのテーブルを作成
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS secure_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id TEXT,
    message_content TEXT,
    access_path TEXT UNIQUE,
    password_plain TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Table "secure_messages" is ready.');
  });
});

// ルートURLへのテスト用レスポンス
app.get('/', (req, res) => {
  res.send('Hello World from Server!');
});

// [POST] /api/messages Slackからのリクエストを処理するAPI
app.post('/api/messages', (req, res) => {
  // 1. Slackから送られてきたデータを取り出す
  const { user_name, text } = req.body;

  // Slackからのデータ形式では、宛先とメッセージは text の中に入っている
  // 例: "@user 本文"
  // ここでは簡単化のため、text全体をメッセージとして扱う
  const recipient_id = user_name; // コマンド実行者
  const message_content = text;   // メッセージ本文

  // 2. データが空でないか確認する
  if (!recipient_id || !message_content) {
    return res.status(400).send('ユーザー名とメッセージが必要です。');
  }

  // 3. URLパスとパスワードを生成する
  const access_path = crypto.randomBytes(8).toString('hex');
  const password_plain = crypto.randomBytes(4).toString('hex');

  // 4. データベースに情報を保存する
  const sql = `INSERT INTO secure_messages (recipient_id, message_content, access_path, password_plain) VALUES (?, ?, ?, ?)`;

  db.run(sql, [recipient_id, message_content, access_path, password_plain], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).send('データベースエラーが発生しました。');
    }

    console.log(`A new message has been created with ID: ${this.lastID}`);

    // 5. 成功したら、コマンド実行者にだけ見えるメッセージでURLとパスワードを返す
    res.json({
      response_type: 'ephemeral',
      text: `メッセージを作成しました！\nURL: http://3.27.234.148:3000/messages/${access_path}\nPassword: ${password_plain}`
    });
  });
});

// [POST] /api/auth メッセージ取得のための認証API
app.post('/api/auth', (req, res) => {
  const { access_path, password_plain } = req.body;
  const sql = `SELECT * FROM secure_messages WHERE access_path = ?`;

  db.get(sql, [access_path], (err, row) => {
    if (err) {
      return res.status(500).json({ status: 'エラー', message: 'データベースエラーです。' });
    }
    if (!row) {
        return res.status(404).json({ status: 'エラー', message: '無効なURLです。' });
    }
    if (row.password_plain !== password_plain) {
      return res.status(401).json({ status: 'エラー', message: 'パスワードが違います。' });
    }

    res.json({
      status: '成功しました。',
      message_content: row.message_content
    });
  });
});

// 設定したPORT番号でサーバーを起動、リクエストを待つ
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});