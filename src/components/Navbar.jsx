import { Link } from "react-router-dom";
import "../styled/navbar.css";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function Navbar() {
  const { toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="nav">
      <h2 className="nav-logo">
        🍊 Mealify
      </h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
      </div>

      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        🌙
      </button>
    </nav>
  );
}