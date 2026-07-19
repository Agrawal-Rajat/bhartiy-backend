import PropertyBuyer from "../../models/PropertyBuyer/property.buyer.model.js"

const PropertyBuyerProduct=async (req,res)=>{
  try{
    const {userID,propertyID}=req.body
    await PropertyBuyer.insertOne({userID:userID,propertyID:propertyID})
    if(!userID && !intrestedID){
      return res.status(500).json({status:false,message:"All Field Are Required"})
    }
    return res.status(200).json({status:true,message:"Property for approval Addedd"})
  }catch (error) {
    console.error("Property Buy Data Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

const GetPropertyBuyers=async(req,res)=>{
  try{
  const {id}=req.body
  // console.log(id)
  const applicants=await PropertyBuyer.find({propertyID:id}).populate("userID")
    return res.status(200).json({status:true,message:"Property Buyers Found Successfully",applicants:applicants})

  }catch (error) {
    console.error("Property Buyers Data Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}

const GetPropertyBuyerById=async(req,res)=>{
  try{
  const {id}=req.body
  // console.log(id)
  const applicants=await PropertyBuyer.find({userID:id}).populate("userID").populate("propertyID")
    return res.status(200).json({status:true,message:" Property Applicant Found Successfully",applicants:applicants})

  }catch (error) {
    console.error("PropertyApllicantData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}


const updateStatusOfPropertyBuyer=async(req,res)=>{
  try{
    const {id,status}=req.body
    const updates=await PropertyBuyer.findByIdAndUpdate(id,{status:status},{new:true})
    console.log(req.body)
    return res.status(200).json({status:true,message:"Property Buyer Data Status Updated Successfully",updated:updates})

  }catch (error) {
    console.error("PropertyData Status Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}
export {PropertyBuyerProduct,updateStatusOfPropertyBuyer,GetPropertyBuyers,GetPropertyBuyerById}