import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import { authRouter } from "./src/routes/auth.routes.js";
import { JobCategoryRoute } from "./src/routes/job_category.routes.js";
import { ThriftCategoryRoute } from "./src/routes/thrift_category.routes.js";
import { JobRoute } from "./src/routes/job.routes.js";
import { YouthRoute } from "./src/routes/youth.routes.js";
import { ThriftRoute } from "./src/routes/thrift.routes.js";
import { PropertyCategoryRoute } from "./src/routes/property_category.routes.js";
import { PropertyRoute } from "./src/routes/property.routes.js";
import { HeroRoute } from "./src/routes/hero.routes.js";
import { MatrimonialRouter } from "./src/routes/matrimonial.routes.js";
import connectDb from "./src/config/db.js";
import path from "path";
import { JobApplyRouter } from "./src/routes/job.apply.route.js";
import { ThriftBuyRouter } from "./src/routes/thrift.buy.route.js";
import { PropertyBuyRouter } from "./src/routes/property.buy.route.js";
import { HomeRoute } from "./src/routes/home.routes.js";
import { LiveSessionRoute } from "./src/routes/live.sessions.routes.js";
import { SaveSessionRoute } from "./src/routes/save.sessions.routes.js";
import { VisitorRoute } from "./src/routes/visitor.routes.js";
import { TrainingRoute } from "./src/routes/training.route.js";
import { TrainingApplyRouter } from "./src/routes/training.apply.route.js";

// configuring 
dotenv.config();
const app = express();
app.set("trust proxy", 1);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://bhartiy-frontend.vercel.app",
  "https://www.bhartiy.in/",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/uploads", express.static(path.join("uploads")))
app.use(bodyParser.urlencoded({ extended: true }));

// middlewares
app.use(express.json());
app.use(cookieParser());


app.get("/", async (req, resp) => {
  const res = await connectDb()
  // console.log(res)
  return resp.send(res)
})

app.use("/api/auth", authRouter);
app.use("/api/jobcategory", JobCategoryRoute);
app.use("/api/thriftcategory", ThriftCategoryRoute);
app.use("/api/job", JobRoute);
app.use("/api/youth", YouthRoute);
app.use("/api/thrift", ThriftRoute);
app.use("/api/propertiescategory", PropertyCategoryRoute);
app.use("/api/property", PropertyRoute);
app.use("/api/hero", HeroRoute);
app.use("/api/matrimonial", MatrimonialRouter)
app.use("/api/jobapply", JobApplyRouter)
app.use("/api/thriftbuy", ThriftBuyRouter)
app.use("/api/propertybuy", PropertyBuyRouter)
app.use("/api/homebanner", HomeRoute)
app.use("/api/livesession", LiveSessionRoute)
app.use("/api/savesession", SaveSessionRoute)
app.use("/api/visitors", VisitorRoute)
app.use("/api/training", TrainingRoute)
app.use("/api/trainingapply", TrainingApplyRouter)
// start app
const PORT = process.env.PORT || 3000;
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // server ko start hi mat karo agar DB connect nahi hua
  });
