import React, { useState } from 'react'; //Reactの状態を管理する
import {useParams} from 'react-router-dom';
function MessagePage() {
    const {access_path} = useParams();

    const[password, setPassword] = useState('');
    const[message, setMessage] = useState('');
    const[error, setError] = useState('');

    const handleSubmit = async (event) => { // フォーム送信時の処理関数
        event.preventDefault();
        setError('');
        setMessage('');
        try{
            const response = await fetch('http://localhost:3001/api/auth', { //Node.jsの認証APIにPOSTリクエストを送る(postmanで確認したとこ)
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ access_path: access_path, password_plain: password }),
            });
        const data = await response.json();
        if (response.ok) {
            setMessage(data.message_content);
        } else {
            setError(data.error || 'メッセージの取得に失敗しました。');
        }
    } catch (error) {
        setError('サーバーエラーが発生しました。');
    }}
  return (
    <div>
      <form onSubmit={handleSubmit}>
      <h2>パスワード入力</h2>
      <p>アクセスパス:<strong>{access_path}</strong> </p>
      <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワードを入力"
          required
      />
      <button type="submit">送信</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      </form>
    </div>
  );


}
export default MessagePage;