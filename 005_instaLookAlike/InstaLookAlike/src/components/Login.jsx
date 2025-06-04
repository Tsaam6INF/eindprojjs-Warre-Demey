/**
 * Login Component
 * 
 * Deze component biedt een formulier voor gebruikers om in te loggen.
 * Het verwerkt de authenticatie en navigeert naar de home pagina na succesvolle login.
 * 
 * Functionaliteiten:
 * 1. Login formulier met validatie
 * 2. Foutafhandeling
 * 3. Navigatie na succesvolle login
 * 4. Link naar registratie pagina
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ onLogin }) {
  // State management voor formulier en fouten
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * Handler voor het bijwerken van formuliervelden
   * 
   * @param {Event} e - Het change event van het input veld
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Handler voor het indienen van het login formulier
   * Verwerkt de authenticatie en navigeert bij succes
   * 
   * @param {Event} e - Het submit event van het formulier
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan bij het inloggen');
      }

      // Update de app state en navigeer
      onLogin({
        token: data.token,
        id: data.id,
        username: data.username
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in op je account
          </h2>
        </div>

        {/* Login formulier */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email adres</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email adres"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Wachtwoord</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Wachtwoord"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Foutmelding */}
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Inloggen
            </button>
          </div>
        </form>

        {/* Link naar registratie */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Nog geen account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Registreer hier
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
