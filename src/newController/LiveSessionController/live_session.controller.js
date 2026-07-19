import LiveSessions from "../../models/LiveSessionModels/live_session_model.js";
const insertSession=async(req,res)=>{
try{
const {_id,link,role,title}=req.body
// console.log(req.body)
await LiveSessions.deleteOne({_id:_id})
const data=await LiveSessions.insertOne({title:title,role:role,link:link})
return res.status(200).json({success:true,message:"Session Inserted",data:data})
}catch(error){
    console.error("Error in SessionInsertController:", error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
}

const getSession=async(req,res)=>{
try{
// console.log(req.body)
const {role}=req.query
var data;
if(role=="admin"){

     data=await LiveSessions.find({})
}
else{
    data=await LiveSessions.find({role:role})
}
return res.status(200).json({success:true,message:"Session Fetched",data:data})
}catch(error){
    console.error("Error in SessionFetchController:", error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
}
}
export {insertSession,getSession}