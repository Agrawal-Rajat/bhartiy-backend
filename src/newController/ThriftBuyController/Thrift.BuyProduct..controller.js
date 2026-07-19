import ThriftBuyApplies from "../../models/ThriftBuy/thrift.buy.model.js"

const BuyThriftProduct=async (req,res)=>{
  try{
    const {userID,ThriftProductID}=req.body
    await ThriftBuyApplies.insertOne({userID:userID,ThriftProductID:ThriftProductID})
    if(!userID && !intrestedID){
      return res.status(500).json({status:false,message:"All Field Are Required"})
    }
    return res.status(200).json({status:true,message:"Product for approval Addedd"})
  }catch (error) {
    console.error("Thrift Product Data Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

const GetBuyers=async(req,res)=>{
  try{
  const {id}=req.body
  // console.log(id)
  const applicants=await ThriftBuyApplies.find({ThriftProductID:id}).populate("userID")
    return res.status(200).json({status:true,message:" Buyers Found Successfully",applicants:applicants})

  }catch (error) {
    console.error("Thift Buyers Data Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}

const GetBuyersById=async(req,res)=>{
  try{
  const {id}=req.body
  // console.log(id)
  const applicants=await ThriftBuyApplies.find({userID:id}).populate("userID").populate("ThriftProductID")
    return res.status(200).json({status:true,message:" Thrift Applicant Found Successfully",applicants:applicants})

  }catch (error) {
    console.error("ThriftApllicantData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

const updateStatusOfBuyer=async(req,res)=>{
  try{
    const {id,status}=req.body
    const updates=await ThriftBuyApplies.findByIdAndUpdate(id,{status:status},{new:true})
    console.log(req.body)
    return res.status(200).json({status:true,message:" Buyer Data Status Updated Successfully",updated:updates})

  }catch (error) {
    console.error("BuyersData Status Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}
export {BuyThriftProduct,updateStatusOfBuyer,GetBuyers,GetBuyersById}