import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const schema = new mongoose.Schema({}, { collection: "nutritionlogs", strict: false });
const NutritionLog = mongoose.model("NutritionLog", schema);

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await NutritionLog.deleteMany({ date: { $in: ["weekly", "all"] } });
    console.log("Deleted bad logs:", result.deletedCount);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

cleanup();
