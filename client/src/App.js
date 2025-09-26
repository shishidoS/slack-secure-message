import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MessagePage from './pages/MessagePage';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>秘密メッセージ</h1>
        <Routes>
          <Route path="/messages/:access_path" element={<MessagePage />}/>

        </Routes>
      </div>
    </Router>
  );


}
export default App; 