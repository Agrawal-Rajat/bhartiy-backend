import mongoose from "mongoose";

const HeroSchema = new mongoose.Schema(
  {
    title: { type: String, required: true,  trim: true },
    description: { type: String, required: true,  trim: true },
    poster: { type: String, required: true,  trim: true },
  },
  { timestamps: true }
);

const Hero = mongoose.model("hero", HeroSchema);

export default Hero;
