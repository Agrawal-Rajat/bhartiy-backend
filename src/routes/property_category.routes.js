import { insertPropertyCategory,EditPropertyCategory,DeletePropertyCategory,getPropertyCategory } from "../newController/PropertyCategory/property.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { Router } from "express";
const PropertyCategoryRoute=Router()
PropertyCategoryRoute.post("/insertpropertycategory",verifyToken,insertPropertyCategory)
PropertyCategoryRoute.get("/getpropertycategory",getPropertyCategory)
PropertyCategoryRoute.put("/editpropertycategory",verifyToken,EditPropertyCategory)
PropertyCategoryRoute.delete("/deletepropertycategory/:id",verifyToken,DeletePropertyCategory)
export{PropertyCategoryRoute}