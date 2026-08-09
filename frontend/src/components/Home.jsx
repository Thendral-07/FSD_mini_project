import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Search, ArrowRight, ChefHat, HeartPulse, ListPlus, Utensils, Flame, Leaf } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const [search, setSearch] = React.useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.from(".hero-text > *", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      });

      gsap.from(".hero-image", {
        scale: 0.8,
        opacity: 0,
        duration: 1.5,
        ease: "power3.out",
        delay: 0.3,
      });

      // Features Animation
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/discover?q=${encodeURIComponent(search)}`);
    } else {
      navigate("/discover");
    }
  };

  return (
    <div className="w-full relative overflow-hidden">
      {/* Floating Icons (Moved to global or kept here? Keep floating icons here since they are theme specific for Home) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-[15%] text-orange-400/40 hidden md:block"
        >
          <Utensils className="w-16 h-16" />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 left-[10%] text-primary/30 hidden md:block"
        >
          <ChefHat className="w-24 h-24" />
        </motion.div>

        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-40 right-[10%] text-red-400/30 hidden md:block"
        >
          <Flame className="w-20 h-20" />
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-20 right-[15%] text-green-500/30 hidden md:block"
        >
          <Leaf className="w-16 h-16" />
        </motion.div>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[80vh] flex flex-col lg:flex-row items-center justify-center gap-12 py-20">
        <div className="hero-text flex-1 space-y-8 max-w-2xl text-center lg:text-left">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-tight">
            Premium Recipes for <span className="bg-gradient-to-r from-orange-400 to-primary bg-clip-text text-transparent">Part-Time Cookers</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Short on time? DishFlash V2.0 brings you quick, personalized meal plans, effortless nutrition tracking, and culinary inspiration tailored for your busy lifestyle.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ingredients or recipes..." 
                className="pl-10 h-14 text-lg rounded-full shadow-sm"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 rounded-full px-8">
              Search
            </Button>
          </form>

          <div className="flex gap-4 pt-4">
            {!isAuthenticated && (
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/signup">Join for Free <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            )}
            <Button asChild size="lg" variant="ghost" className="rounded-full">
              <Link to="/discover">Explore Random Meals</Link>
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full max-w-xl relative">
          <div className="hero-image relative aspect-square rounded-full overflow-hidden border-8 border-background shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000" 
              alt="Delicious healthy food" 
              className="object-cover w-full h-full"
            />
          </div>
          {/* Floating badge */}
          <div className="hero-image absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Nutrition</p>
              <p className="font-bold">Tracked Daily</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold">Everything you need to eat better</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">From discovery to cooking, we've got you covered.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Search}
            title="Smart Discovery"
            description="Find meals by ingredients you already have in your fridge. Save your favorites for later."
          />
          <FeatureCard 
            icon={ListPlus}
            title="Weekly Planning"
            description="Plan your breakfast, lunch, and dinner. Automatically generate shopping lists."
          />
          <FeatureCard 
            icon={ChefHat}
            title="Creator Recipes"
            description="Share your own recipes with the community or keep them private for your personal cookbook."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="feature-card bg-card border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
