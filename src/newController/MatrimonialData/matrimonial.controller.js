import Auth from "../../models/AuthModel/auth.model.js";
import MatrimonialApplies from "../../models/MatrimonialApplies/matrimonial_applies.model.js";

const GetMetrimonialData = async (req, res) => {
  try {
    const { page = 1, limit = 6, gender = "All",access } = req.query;
console.log(page,limit,gender,access)
    const pageNumber = parseInt(page);
    const limitPage = parseInt(limit);
    const skip = (pageNumber - 1) * limitPage;

    // Base condition: biodata must exist
    let query = {
      biodata: { $exists: true, $ne: "" },
    };

    // Exclude gender if NOT "All"
    if (gender !== "All" || gender!=="other") {
      query.gender = { $ne: gender };
    }
    if(access==="user"){
      query.status="approved"
    }

    const totalRecords = await Auth.countDocuments(query);

    const data = await Auth.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitPage);
// console.log(data)
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Biodata Found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Biodata Records Found",
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitPage),
        currentPage: pageNumber,
        limit: limitPage
      }
    });

  } catch (error) {
    console.error("GetMetrimonialData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const GetMatrimonialProfileStatusById=async(req,res)=>{
  try{
  const {id}=req.body
  // console.log(id)
  const applicants=await MatrimonialApplies.find({intrestedID:id}).populate("userID").populate("intrestedID")
    return res.status(200).json({status:true,message:" Matrimonial Applicant Found Successfully",applicants:applicants})

  }catch (error) {
    console.error("MatrimonialApllicantData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}


const AddIntrest=async (req,res)=>{
  try{
    const {userID,intrestedID}=req.body
    await MatrimonialApplies.insertOne({userID:userID,intrestedID:intrestedID})
    if(!userID && !intrestedID){
      return res.status(500).json({status:false,message:"All Field Are Required"})
    }
    return res.status(200).json({status:true,message:"Intreset Addedd"})
  }catch (error) {
    console.error("GetMetrimonialData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

const GetMetrimonialProfileForAdmin=async(req,res)=>{
  try{
    const resdata=await MatrimonialApplies.find({})
    .populate("userID")
    .populate("intrestedID");
    return res.status(200).json({
      success: true,
      message: "Profiles Fetched",
      data:resdata
    });

  }catch (error) {
    console.error("GetMetrimonialData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}
const GetProfileLikers=async(req,res)=>{
  try{
  const {id}=req.body
  // console.log(id)
  const applicants=await MatrimonialApplies.find({userID:id}).populate("intrestedID")
    return res.status(200).json({status:true,message:"Profile Likers Found Successfully",applicants:applicants})

  }catch (error) {
    console.error("Profile Likers Data Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}

const updateStatusOfProfileLikers=async(req,res)=>{
  try{
    const {id,status}=req.body
    // console.log(req.body)
    const updates=await Auth.findByIdAndUpdate(id,{status:status},{new:true})
    return res.status(200).json({status:true,message:"Profile Likers Data Status Updated Successfully",updated:updates})

  }catch (error) {
    console.error("Profile likers Status Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}
export { GetMetrimonialData,AddIntrest,GetMetrimonialProfileForAdmin,GetProfileLikers,updateStatusOfProfileLikers,GetMatrimonialProfileStatusById };
