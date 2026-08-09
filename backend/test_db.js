import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const schema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: String,
  calories: Number,
}, { collection: "nutritionlogs" });

const NutritionLog = mongoose.model("NutritionLog", schema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await NutritionLog.countDocuments();
    const all = await NutritionLog.find().limit(5);
    console.log("Total NutritionLogs:", count);
    console.log("Samples:", all);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

check();
