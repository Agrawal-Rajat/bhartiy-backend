import { insertThriftCategory,EditThriftCategory,DeleteThriftCategory,getThriftCategory } from "../newController/ThriftCategory/thrift_category.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { Router } from "express";
const ThriftCategoryRoute=Router()
ThriftCategoryRoute.post("/insertthriftcategory",verifyToken,insertThriftCategory)
ThriftCategoryRoute.get("/getthriftcategory",getThriftCategory)
ThriftCategoryRoute.put("/editthriftcategory",verifyToken,EditThriftCategory)
ThriftCategoryRoute.delete("/deletethriftcategory/:id",verifyToken,DeleteThriftCategory)

export{ThriftCategoryRoute}