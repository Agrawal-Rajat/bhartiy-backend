import mongoose from "mongoose";

const HomeBannerSchema = new mongoose.Schema(
  {
    heading: { type: String, default: "", trim: true },
    subheading: { type: String, default: "", trim: true },
    link: { type: String, default: "", trim: true },
    poster: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const HomeBanner = mongoose.model("home_banner", HomeBannerSchema);

export default HomeBanner;
