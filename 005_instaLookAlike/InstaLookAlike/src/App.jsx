import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './components/Login';
import Register from './components/Register';
import Feed from './components/Feed';
import CreatePost from './components/CreatePost';
import { useState } from 'react';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <nav className="p-4 bg-pink-500 text-white">
        <Link to="/">Feed</Link> | <Link to="/profile">Profile</Link>
        {!user && <> | <Link to="/login">Login</Link> | <Link to="/register">Register</Link></>}
        {user && <span className="ml-4">Welcome, {user.username}</span>}
        {user && <Link to="/create">Nieuwe Post</Link>}

      </nav>

      <Routes>
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Feed />} />
        <Route path="/create" element={<CreatePost user={user} />} />
        </Routes>
    </Router>
  );
}

export default App;
