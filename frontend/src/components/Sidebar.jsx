import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { Home, Compass, Heart, History, User, Calendar, Activity, ShoppingCart, LogOut, FileText, Sparkles, Users, Sun, Moon } from "lucide-react";
import { cn } from "../utils/utils";
import { motion } from "framer-motion";
import "../styled/navbar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Dashboard", path: "/dashboard", icon: Activity, protected: true },
    { name: "Discover", path: "/discover", icon: Compass },
    { name: "Favorites", path: "/favorites", icon: Heart, protected: true },
    { name: "Meal Planner", path: "/planner", icon: Calendar, protected: true },
    { name: "Creator Recipes", path: "/creator-recipes", icon: FileText, protected: true },
    { name: "Community", path: "/community", icon: Users },
    { name: "Diet Recs", path: "/recommendations", icon: Sparkles, protected: true },
    { name: "Profile", path: "/profile", icon: User, protected: true },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r fixed left-0 top-0 z-40 p-4">
      <div className="flex items-center gap-2 mb-8 px-2 mt-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
        <span className="text-xl font-bold tracking-tight">DishFlash</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
        {navItems.map((item) => {
          if (item.protected && !user) return null;
          
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className="block relative"
            >
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors z-10 relative",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary rounded-lg z-0"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t mt-auto flex flex-col gap-4">
        <div className="flex justify-center w-full pb-2">
          <div className="theme-toggle-wrapper" onClick={toggleTheme}>
            <span className={`theme-label ${!isDark ? 'active' : ''}`}>Light</span>
            <div className="theme-toggle-track">
              <div className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`}>
                {isDark ? <Moon size={16} strokeWidth={2.5} /> : <Sun size={16} strokeWidth={2.5} />}
              </div>
            </div>
            <span className={`theme-label ${isDark ? 'active' : ''}`}>Dark</span>
          </div>
        </div>

        {user ? (
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Log out</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
