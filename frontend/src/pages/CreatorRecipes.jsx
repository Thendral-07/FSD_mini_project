import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Loader2, Plus, Upload, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreatorRecipes() {
  const { authFetch } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editRecipeId, setEditRecipeId] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Chicken");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/recipes/me");
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (recipe) => {
    setEditRecipeId(recipe._id);
    setTitle(recipe.title);
    setDescription(recipe.description);
    setCategory(recipe.category || "Chicken");
    setIngredients(recipe.ingredients.map(i => i.name).join("\n"));
    setInstructions(recipe.instructions);
    setIsPublic(recipe.isPublic);
    setImageFile(null); // Leave as null unless changing it
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditRecipeId(null);
    setTitle("");
    setDescription("");
    setCategory("Chicken");
    setIngredients("");
    setInstructions("");
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("isPublic", isPublic);
    
    // Convert multiline text to arrays for simple submission
    const ingArray = ingredients.split('\n').map(i => {
      // Basic split for "2 cups Flour" -> name: "Flour", measure: "2 cups" is hard. Let's just put it in name.
      return { name: i.trim(), measure: "" };
    }).filter(i => i.name);
    
    // Instructions can just be a single string separated by newlines, but schema expects string.
    // Wait, the schema in CreatorRecipe.js for instructions is:
    // instructions: { type: String, required: true }
    // So we don't need to JSON.stringify instructions if it's just a string.
    
    formData.append("ingredients", JSON.stringify(ingArray));
    formData.append("instructions", instructions);
    
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = editRecipeId ? `/recipes/${editRecipeId}` : "/recipes";
      const method = editRecipeId ? "PUT" : "POST";
      
      const res = await authFetch(url, {
        method: method,
        headers: {}, // Let browser set boundary
        body: formData,
      });
      if (res.ok) {
        await fetchRecipes();
        handleCancel();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" /> My Recipes
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage your personal cookbook.</p>
        </div>
        <Button onClick={() => isCreating ? handleCancel() : setIsCreating(true)}>
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Create Recipe</>}
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 shadow-md mb-8">
              <CardHeader className="bg-muted/30">
                <CardTitle>{editRecipeId ? "Edit Recipe" : "Create a New Recipe"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Recipe Title</label>
                        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grandma's Apple Pie" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea 
                          required
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                          placeholder="A short description of this amazing dish..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                        >
                          <option value="Chicken">Chicken</option>
                          <option value="Beef">Beef</option>
                          <option value="Seafood">Seafood</option>
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Vegan">Vegan</option>
                          <option value="Pasta">Pasta</option>
                          <option value="Dessert">Dessert</option>
                          <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <input 
                          type="checkbox" 
                          id="isPublic" 
                          checked={isPublic} 
                          onChange={e => setIsPublic(e.target.checked)}
                          className="w-4 h-4 text-primary rounded border-gray-300"
                        />
                        <label htmlFor="isPublic" className="text-sm font-medium">Make this recipe public (visible to everyone)</label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Recipe Image</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {imageFile ? imageFile.name : "Click to upload image"}
                            </p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ingredients (One per line)</label>
                      <textarea 
                        required
                        value={ingredients}
                        onChange={e => setIngredients(e.target.value)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
                        placeholder="2 cups flour&#10;1 cup sugar&#10;3 eggs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Instructions (One step per line)</label>
                      <textarea 
                        required
                        value={instructions}
                        onChange={e => setInstructions(e.target.value)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
                        placeholder="Mix dry ingredients.&#10;Add wet ingredients.&#10;Bake at 350 for 30 minutes."
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (editRecipeId ? "Update Recipe" : "Publish Recipe")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!recipes.length ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No recipes yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">You haven't created any recipes. Click the button above to add your first culinary masterpiece.</p>
          <Button onClick={() => setIsCreating(true)} variant="outline">Create your first recipe</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <Card 
              key={recipe._id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border hover:border-primary/50"
              onClick={() => handleEditClick(recipe)}
            >
              {recipe.imageUrl && (
                <div className="h-48 w-full overflow-hidden">
                  <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
                  {!recipe.isPublic && <span className="text-[10px] px-2 py-1 bg-muted rounded-full font-medium whitespace-nowrap">Private</span>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{recipe.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <div><strong>{recipe.ingredients ? recipe.ingredients.length : 0}</strong> Ingredients</div>
                  <div><strong>{recipe.instructions ? recipe.instructions.split('\n').filter(Boolean).length : 0}</strong> Steps</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
