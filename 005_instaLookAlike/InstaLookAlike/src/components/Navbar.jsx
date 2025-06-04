/**
 * Navbar Component
 * 
 * Deze component toont de navigatiebalk van de applicatie.
 * Het bevat links naar verschillende pagina's en een uitlog knop.
 * 
 * Functionaliteiten:
 * 1. Navigatie links
 * 2. Uitlog functionaliteit
 * 3. Conditionele weergave op basis van authenticatie status
 * 4. Responsive design
 */

import { Link } from "react-router-dom";

function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/instagram-logo.svg" alt="Instagram" className="h-8 w-8" />
            <span className="ml-2 text-xl font-semibold">InstaLookAlike</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-2xl hover:opacity-70 transition-opacity">
              🏠
            </Link>
            <Link to="/create-post" className="text-2xl hover:opacity-70 transition-opacity">
              ➕
            </Link>
            <Link to={`/profile/${user.id}`} className="text-2xl hover:opacity-70 transition-opacity">
              👤
            </Link>
            <button 
              onClick={onLogout}
              className="text-2xl hover:opacity-70 transition-opacity"
            >
              🚪
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 