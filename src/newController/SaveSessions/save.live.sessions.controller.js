import SaveLiveSessions from "../../models/SavedSessions/save.session.model.js"

const saveSession=async(req,res)=>{
try{
const {link,role,title}=req.body
const data=await SaveLiveSessions.insertOne({title:title,role:role,link:link})
return res.status(200).json({success:true,message:`Saved Session of ${role}`,data:data})
}catch(error){
    console.error("Error in SavedSessionInsertController:", error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
}

const getSavedSession=async(req,res)=>{
try{
const {role}=req.query
var data;
if(role=="admin"){

     data=await SaveLiveSessions.find({}).sort({ createdAt: -1 })
}
else{
    data=await SaveLiveSessions.find({role:role}).sort({ createdAt: -1 })
}
return res.status(200).json({success:true,message:"SavedSession Fetched",data:data})
}catch(error){
    console.error("Error in SavedSessionFetchController:", error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
}

 const DeleteSavedSessions = async (req, res) => {
  try {  
    const {id}=req.params
    await SaveLiveSessions.findByIdAndDelete(id)
    res.status(201).json({ success:true, message: "Saved Session Deleted successfully" });
  } catch (error) {
    console.error("Error Deleting Saved Session:", error);
    res.status(500).json({ success:false,message: "Error Deleting Saved Session", error: error.message || error });
  }
};

const EditSavedSessionData = async (req, res) => {
  try {  
    console.log(req.body)
    const {_id, title, link} = req.body;
    const updated=await SaveLiveSessions.findByIdAndUpdate(_id,
      {title:title,link:link},
      {new:true})
    return res.status(201).json({ success:true, message: "Saved Session Edited successfully", data: updated });
  } catch (error) {
    console.error("Error fetching Saved Session Edited:", error);
    return res.status(500).json({ success:false,message: "Error fetching Saved Session Edited", error: error.message || error });
  }
};
export {saveSession,getSavedSession,DeleteSavedSessions,EditSavedSessionData}