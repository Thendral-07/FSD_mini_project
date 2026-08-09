import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import "../styled/navbar.css";

export default function Navbar() {
  const { toggleTheme, isDark } = useContext(ThemeContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  if (isAuthenticated) {
    navLinks.push(
      { name: "Favorites", path: "/favorites" },
      { name: "History", path: "/history" },
      { name: "Dashboard", path: "/dashboard" }
    );
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`nav ${scrolled ? "scrolled" : ""}`}
    >
      <Link to="/" className="nav-logo-link">
        <motion.h2 whileHover={{ scale: 1.05 }} className="nav-logo">DishFlash</motion.h2>
      </Link>

      <div className="nav-links">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.path} to={link.path} className={`relative ${isActive ? "active" : ""}`}>
              {link.name}
              {isActive && (
                <motion.div
                  layoutId="navbar-active"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="nav-right">
        {isAuthenticated ? (
          <motion.div whileHover={{ scale: 1.05 }} className="nav-user">
            <Link to="/dashboard" className="nav-user-link" title="My Account">
              <span className="nav-username">👤 {user?.name?.split(" ")[0]}</span>
            </Link>
            <button className="nav-logout" onClick={logout}>
              Logout
            </button>
          </motion.div>
        ) : (
          <Link to="/login" className="nav-login-link">
            Login
          </Link>
        )}
        <div className="theme-toggle-wrapper" onClick={toggleTheme}>
          <span className={`theme-label ${!isDark ? 'active' : ''}`}>Light</span>
          <div className="theme-toggle-track">
            <div className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`}>
              {isDark ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
            </div>
          </div>
          <span className={`theme-label ${isDark ? 'active' : ''}`}>Dark</span>
        </div>
      </div>
    </motion.nav>
  );
}