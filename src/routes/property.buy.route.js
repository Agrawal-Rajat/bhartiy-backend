import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js";
import { GetPropertyBuyerById, GetPropertyBuyers, PropertyBuyerProduct, updateStatusOfPropertyBuyer } from "../newController/PropertyBuyer/property.buyer.controller.js";

const PropertyBuyRouter = Router();

PropertyBuyRouter.post("/buyproperty",verifyToken, PropertyBuyerProduct);
PropertyBuyRouter.post("/getbuyerapplicants",verifyToken, GetPropertyBuyers);
PropertyBuyRouter.post("/getbuyerapplicantbyid",verifyToken, GetPropertyBuyerById);
PropertyBuyRouter.put("/updatestatusofpropertybuyer",verifyToken, updateStatusOfPropertyBuyer);

export { PropertyBuyRouter }