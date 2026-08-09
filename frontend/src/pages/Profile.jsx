import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Loader2, Save, Upload, Calculator } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { authFetch, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    fitnessGoal: "Maintenance",
    dietaryPreferences: [],
    allergies: [],
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authFetch("/profile");
      const data = await res.json();
      setProfile(data);
      setFormData({
        age: data.age || "",
        gender: data.gender || "",
        height: data.height || "",
        weight: data.weight || "",
        fitnessGoal: data.fitnessGoal || "Maintenance",
        dietaryPreferences: data.dietaryPreferences || [],
        allergies: data.allergies || [],
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTDEE = (data) => {
    if (!data.weight || !data.height || !data.age || !data.gender) return { bmr: 0, tdee: 0 };
    
    // Mifflin-St Jeor Equation
    let bmr = (10 * parseFloat(data.weight)) + (6.25 * parseFloat(data.height)) - (5 * parseInt(data.age));
    bmr += (data.gender === "Male" ? 5 : -161);
    
    // Sedentary multiplier as baseline for TDEE, can be enhanced
    const tdee = bmr * 1.2;
    return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const { bmr, tdee } = calculateTDEE(formData);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (Array.isArray(formData[key])) {
        // Send as comma-separated string to match our backend parsing
        data.append(key, formData[key].join(", "));
      } else {
        data.append(key, formData[key]);
      }
    });
    data.append("bmr", bmr);
    data.append("tdee", tdee);
    
    if (imageFile) {
      data.append("profileImage", imageFile);
    }

    try {
      const res = await authFetch("/profile", {
        method: "PUT",
        headers: {}, // Remove Content-Type so browser sets boundary for FormData
        body: data,
      });

      if (!res.ok) throw new Error("Failed to save profile");
      
      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setMessage("Profile saved successfully!");
      setImageFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile & Health</h1>
          <p className="text-muted-foreground mt-1">Manage your dietary preferences and calculate calories.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
      {message && <div className="p-4 bg-green-500/10 text-green-600 rounded-lg">{message}</div>}

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/20">
                  {profile?.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-muted-foreground">{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                  </label>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {imageFile && <p className="text-sm text-primary mt-1">Image selected, ready to save.</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <Input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="e.g. 25" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Height (cm)</label>
                  <Input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="e.g. 175" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <Input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="e.g. 70.5" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fitness Goal</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.fitnessGoal}
                  onChange={e => setFormData({...formData, fitnessGoal: e.target.value})}
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Muscle Building">Muscle Building</option>
                  <option value="Weight Gain">Weight Gain</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dietary Preferences (Hold Ctrl/Cmd to select multiple)</label>
                  <select 
                    multiple
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-32"
                    value={formData.dietaryPreferences}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, dietaryPreferences: selected});
                    }}
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Pescetarian">Pescetarian</option>
                    <option value="Keto">Keto</option>
                    <option value="Paleo">Paleo</option>
                    <option value="Halal">Halal</option>
                    <option value="Kosher">Kosher</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Allergies (Hold Ctrl/Cmd to select multiple)</label>
                  <select 
                    multiple
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-32"
                    value={formData.allergies}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, allergies: selected});
                    }}
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Eggs">Eggs</option>
                    <option value="Tree Nuts">Tree Nuts</option>
                    <option value="Peanuts">Peanuts</option>
                    <option value="Shellfish">Shellfish</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Soy">Soy</option>
                    <option value="Fish">Fish</option>
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Calculator className="w-5 h-5" /> Calorie Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background rounded-xl border">
                <p className="text-sm text-muted-foreground font-medium mb-1">Your BMR (Basal Metabolic Rate)</p>
                <p className="text-3xl font-bold">{profile?.bmr || 0} <span className="text-sm font-normal text-muted-foreground">kcal/day</span></p>
                <p className="text-xs text-muted-foreground mt-2">Calories burned at rest.</p>
              </div>
              
              <div className="p-4 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20">
                <p className="text-sm font-medium opacity-90 mb-1">Estimated TDEE</p>
                <p className="text-3xl font-bold">{profile?.tdee || 0} <span className="text-sm font-normal opacity-80">kcal/day</span></p>
                <p className="text-xs opacity-90 mt-2">Total Daily Energy Expenditure to maintain weight.</p>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                These values are calculated automatically when you save your height, weight, age, and gender.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
