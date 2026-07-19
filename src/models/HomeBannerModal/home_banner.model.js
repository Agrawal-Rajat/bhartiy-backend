import mongoose from "mongoose";

const HomeBannerSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true,  trim: true },
    subheading: { type: String, required: true,  trim: true },
    poster: { type: String, required: true,  trim: true },
  },
  { timestamps: true }
);

const HomeBanner = mongoose.model("home_banner", HomeBannerSchema);

export default HomeBanner;
