import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./context/ThemeContext";
import { ImageProvider } from "./context/ImageContext";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Home from "./components/Home";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import Planner from "./pages/Planner";
import Recommendations from "./pages/Recommendations";
import CreatorRecipes from "./pages/CreatorRecipes";
import Community from "./pages/Community";
import About from "./components/About";
import Contact from "./components/Contact";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Favorites from "./components/Favorites";
import History from "./components/History";
import Dashboard from "./components/Dashboard";
import CustomCursor from "./components/CustomCursor";
import AnimatedBackground from "./components/AnimatedBackground";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ImageProvider>
          <BrowserRouter>
            <CustomCursor />
            <AnimatedBackground />
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/creator-recipes" element={<CreatorRecipes />} />
                <Route path="/community" element={<Community />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/history" element={<History />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </ImageProvider>
      </AuthProvider>
      <Analytics />
    </ThemeProvider>
  );
}