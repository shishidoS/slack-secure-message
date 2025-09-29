import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

function MessagePage() {
  const { access_path } = useParams();

  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null); // ファイルを管理するStateを追加
  const [message, setMessage] = useState(null); // messageをオブジェクトとして管理
  const [error, setError] = useState('');
  
  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // 選択されたファイルを設定
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage(null);

    // FormDataオブジェクトを作成
    const formData = new FormData();
    formData.append('access_path', access_path);
    formData.append('password_plain', password);
    if (file) {
      formData.append('file', file); // ファイルがあれば追加
    }

    try {
      // fetchの送信方法を変更
      const response = await fetch('http://localhost:3001/api/auth', {
        method: 'POST',
        // 'Content-Type'ヘッダーはFormDataを使うとブラウザが自動設定するので削除
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data); // 成功データをオブジェクトごと保存
      } else {
        setError(data.message || '処理に失敗しました。');
      }
    } catch (err) {
      setError('サーバーエラーが発生しました。');
    }
  };

  return (
    <div>
      {message && (
        <div className="message-box">
          <p>{message.message_content}</p>
          {/* ファイルパスがあればダウンロードリンクを表示 */}
          {message.file_path && (
            <a href={`http://localhost:3001/${message.file_path.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer">
              添付ファイルをダウンロード
            </a>
          )}
        </div>
      )}
      
      {error && <div className="error-box">{error}</div>}

      {!message && (
        <form onSubmit={handleSubmit}>
          <h2>Enter Password and Upload File (Optional)</h2>
          <p>URL Path: <strong>{access_path}</strong></p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
          <input
            type="file"
            onChange={handleFileChange} // ファイル選択時の処理
          />
          <button type="submit">View Message</button>
        </form>
      )}
    </div>
  );
}

export default MessagePage;