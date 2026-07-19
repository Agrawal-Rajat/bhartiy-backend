import JobCategory from "../../models/JobCategoryModel/job.category.model.js";

export const insertJobCategory = async (req, res) => {
  try {
    const { name } = req.body;  
    const newJobCategory = new JobCategory({ name });
    await newJobCategory.save();
    res.status(201).json({ success:true, message: "Job category inserted successfully", data: newJobCategory });
  } catch (error) {
    console.error("Error inserting job category:", error);
    res.status(500).json({ success:false,message: "Error inserting job category", error: error.message || error });
  }
};

export const getJobCategory = async (req, res) => {
  try {  
    const data=await JobCategory.find({});
    res.status(201).json({ success:true, message: "Job category fetched successfully", data: data });
  } catch (error) {
    console.error("Error fetching job category:", error);
    res.status(500).json({ success:false,message: "Error fetching job category", error: error.message || error });
  }
};

export const EditJobCategory = async (req, res) => {
  try {  
    const {name,id}=req.body;
    console.log(req.body)
    // console.log(data)
    const updatedData=await JobCategory.findByIdAndUpdate(id,{name:name},{new:true})
    res.status(201).json({ success:true, message: "Job category Edited successfully", data: updatedData });
  } catch (error) {
    console.error("Error Edited job category:", error);
    res.status(500).json({ success:false,message: "Error Edited job category", error: error.message || error });
  }
};

export const DeleteJobCategory = async (req, res) => {
  try {  
    const {id}=req.params
    await JobCategory.findByIdAndDelete(id)
    res.status(201).json({ success:true, message: "Job category Deleting successfully" });
  } catch (error) {
    console.error("Error Deleting job category:", error);
    res.status(500).json({ success:false,message: "Error Deleting job category", error: error.message || error });
  }
};