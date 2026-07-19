import { ThriftInsertController,EditThriftData,getThriftData,ThriftPosters,DeleteThriftContent, getThriftDataForAdmin, updateStatusOfThrift } from "../newController/Thrift/thrift.controller.js";
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
const ThriftRoute=Router()
ThriftRoute.post("/insertthrift",verifyToken,ThriftPosters,ThriftInsertController)
ThriftRoute.get("/getthrifts",getThriftData)
ThriftRoute.get("/getthriftaataforadmin",getThriftDataForAdmin)
ThriftRoute.put("/editthrift",verifyToken,ThriftPosters,EditThriftData)
ThriftRoute.delete("/deletethrift/:id",verifyToken,DeleteThriftContent)
ThriftRoute.put("/updatethriftstatus",verifyToken,updateStatusOfThrift)


export{ThriftRoute}