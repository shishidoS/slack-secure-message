// 必要なライブラリインポートする部分
const express = require('express');
const sqlite3 = require('sqlite3').verbose(); //.verbose()は詳細なエラーメッセージを表示してくれる
const crypto = require('crypto');
const cors = require('cors');

// Expressを使いサーバーを作成
const app = express();
app.use(express.json()); // JSON形式のリクエストを受信可能にする
app.use(cors()); // CORSを有効にする

// サーバーがリクエストを受けるポート番号設定
const PORT = 3001;

// データベースに接続
// './database.db' というファイル名でデータベースを作成・接続
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// メッセージを保存するためのテーブル（表）を作成する
// db.serializeは、中の処理を上から順番に実行することを保証
//TABLE IF NOT EXISTS は、テーブルが存在しない場合のみ作成するSQL文
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

// リクエストの応答を設定する
app.get('/', (req, res) => {
  res.send('Hello World from Server!');  //テスト用レスポンス
});

app.post('/api/messages', (req, res) => {
    const { recipient_id, message_content} = req.body;
    const access_path = crypto.randomBytes(8).toString('hex'); // 8バイトのランダムな文字列を生成
    const password_plain = crypto.randomBytes(4).toString('hex'); // 4バイトのランダムな文字列を生成
    const sql = `INSERT INTO secure_messages (recipient_id, message_content, access_path, password_plain)VALUES (?, ?, ?, ?)`; //?はプレースホルダー安全に値を入れるための場所をとるもの
    db.run(sql, [recipient_id, message_content, access_path, password_plain], function(err) {
    // 成功時生成した情報をSlack Botに返す
    console.log(`A new message has been created with ID: ${this.lastID}`);
    res.status(201).json({
      status: '成功しました。',
      access_path: access_path,
      password_plain: password_plain
    });
  });
});
// メッセージ取得のための認証API
app.post('/api/auth',(req,res) => {
  const { access_path, password_plain } = req.body;
  const sql = `SELECT * FROM secure_messages WHERE access_path = ?`;
    db.get(sql, [access_path], (err, row) => {
    if (row.password_plain !== password_plain) {
      return res.status(401).json({ status: 'エラー', message: 'パスワードが違います' });
    }
    res.json({
      status: '成功しました。',
      message_content: row.message_content
    });
  });
});
//  設定したPORT番号でサーバーを起動、リクエストを待つ
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});