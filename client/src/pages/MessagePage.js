import React from 'react';
import {useParams} from 'react-router-dom';
function MessagePage() {
    const {access_path} = useParams();
  return (
    <div>
      <h2>パスワード入力</h2>
      <p>アクセスパス:<strong>{access_path}</strong> </p>
    </div>
  );


}
export default MessagePage;