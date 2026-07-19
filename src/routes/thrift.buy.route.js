import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js";
import { ApplyToJob } from "../newController/JobApply/job_apply.controller.js";
import { BuyThriftProduct, GetBuyers, GetBuyersById, updateStatusOfBuyer } from "../newController/ThriftBuyController/Thrift.BuyProduct..controller.js";

const ThriftBuyRouter = Router();

ThriftBuyRouter.post("/buythriftproduct",verifyToken, BuyThriftProduct);
ThriftBuyRouter.post("/getbuyers",verifyToken, GetBuyers);
ThriftBuyRouter.post("/getbuyerbyid",verifyToken, GetBuyersById);
ThriftBuyRouter.put("/updatestatusofbuyer",verifyToken, updateStatusOfBuyer);

export { ThriftBuyRouter }