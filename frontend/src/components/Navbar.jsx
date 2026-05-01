import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import "../styled/navbar.css";

export default function Navbar() {
  const { toggleTheme, theme } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <Link to="/" className="nav-logo-link">
        <h2 className="nav-logo">DishFlash</h2>
      </Link>

      <div className="nav-links">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>Home</Link>
        <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>About</Link>
        <Link to="/contact" className={location.pathname === "/contact" ? "active" : ""}>Contact</Link>
        {isAuthenticated && (
          <>
            <Link to="/favorites" className={location.pathname === "/favorites" ? "active" : ""}>Favorites</Link>
            <Link to="/history" className={location.pathname === "/history" ? "active" : ""}>History</Link>
            <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
          </>
        )}
      </div>

      <div className="nav-right">
        {isAuthenticated ? (
          <div className="nav-user">
            <Link to="/dashboard" className="nav-user-link" title="My Account">
              <span className="nav-username">👤 {user?.name?.split(" ")[0]}</span>
            </Link>
            <button className="nav-logout" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="nav-login-link">
            Login
          </Link>
        )}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          🌙
        </button>
      </div>
    </nav>
  );
}