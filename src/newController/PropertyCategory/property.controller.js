import PropertyCategory from "../../models/PropertiesCategoryModel/properties.model.js";

export const insertPropertyCategory = async (req, res) => {
  try {
    const { name } = req.body;  
    const newPropertyCategory = new PropertyCategory({ name });
    await newPropertyCategory.save();
    res.status(201).json({ success:true, message: "Property category inserted successfully", data: newPropertyCategory });
  } catch (error) {
    console.error("Error inserting property category:", error);
    res.status(500).json({ success:false,message: "Error inserting property category", error: error.message || error });
  }
};

export const getPropertyCategory = async (req, res) => {
  try {  
    const data=await PropertyCategory.find({});
    res.status(201).json({ success:true, message: "Property category fetched successfully", data: data });
  } catch (error) {
    console.error("Error fetching property category:", error);
    res.status(500).json({ success:false,message: "Error fetching property category", error: error.message || error });
  }
};

export const EditPropertyCategory = async (req, res) => {
  try {  
    const {name,id}=req.body;
    console.log(req.body)
    // console.log(data)
    const updatedData=await PropertyCategory.findByIdAndUpdate(id,{name:name},{new:true})
    res.status(201).json({ success:true, message: "Property category Edited successfully", data: updatedData });
  } catch (error) {
    console.error("Error Edited property category:", error);
    res.status(500).json({ success:false,message: "Error Edited property category", error: error.message || error });
  }
};

export const DeletePropertyCategory = async (req, res) => {
  try {  
    const {id}=req.params
    await PropertyCategory.findByIdAndDelete(id)
    res.status(201).json({ success:true, message: "Property category Deleting successfully" });
  } catch (error) {
    console.error("Error Deleting property category:", error);
    res.status(500).json({ success:false,message: "Error Deleting property category", error: error.message || error });
  }
};