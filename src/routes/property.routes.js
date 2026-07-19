import { propertyInsertController,EditPropertiesData,DeleteProperty,PropertyPosters,getPropertiesData } from "../newController/Properties/propertyData.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { Router } from "express";
const PropertyRoute=Router()
PropertyRoute.post("/insertproperty",verifyToken,PropertyPosters,propertyInsertController)
PropertyRoute.get("/getproperty",getPropertiesData)
PropertyRoute.put("/editproperty",verifyToken,PropertyPosters,EditPropertiesData)
PropertyRoute.delete("/deleteproperty/:id",verifyToken,DeleteProperty)
export{PropertyRoute}