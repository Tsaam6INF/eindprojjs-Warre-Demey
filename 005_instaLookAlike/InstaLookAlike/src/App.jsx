/**
 * InstaLookAlike Frontend Applicatie
 * 
 * Dit is de hoofdcomponent van de React applicatie die de routing en authenticatie beheert.
 * De applicatie gebruikt React Router voor navigatie en localStorage voor persistentie van de authenticatiestatus.
 * 
 * Belangrijkste functionaliteiten:
 * 1. Authenticatie state management
 * 2. Route bescherming
 * 3. Gebruikerssessie beheer
 * 4. Navigatie tussen verschillende views
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CreatePost from './components/CreatePost';

function App() {
  // State voor authenticatie en gebruikersinformatie
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  /**
   * Effect hook voor het controleren van de authenticatiestatus bij het laden
   * Controleert localStorage voor bestaande sessiegegevens
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (token && userId && username) {
      setIsAuthenticated(true);
      setUser({ id: userId, username });
    }
  }, []);

  /**
   * Handler voor gebruikerslogin
   * Slaat authenticatiegegevens op in localStorage en update de state
   * 
   * @param {Object} userData - Bevat token, id en username van de ingelogde gebruiker
   */
  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('username', userData.username);
    setIsAuthenticated(true);
    setUser({ id: userData.id, username: userData.username });
  };

  /**
   * Handler voor gebruikerslogout
   * Verwijdert authenticatiegegevens uit localStorage en reset de state
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Toon de navigatiebalk alleen voor ingelogde gebruikers */}
        {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Beschermde routes die alleen toegankelijk zijn voor ingelogde gebruikers */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Home user={user} /> : <Navigate to="/login" />} 
            />
            {/* Publieke routes voor authenticatie */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            {/* Beschermde routes voor gebruikersprofielen en post creatie */}
            <Route 
              path="/profile/:userId" 
              element={isAuthenticated ? <Profile user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/create-post" 
              element={isAuthenticated ? <CreatePost user={user} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
