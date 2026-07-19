import ThriftCategory from "../../models/ThriftCategoryModel/thrift.category.model.js";

export const insertThriftCategory = async (req, res) => {
  try {
    const { name } = req.body;  
    // console.log(name)
    const newThriftCategory = new ThriftCategory({ name });
    await newThriftCategory.save();
    res.status(201).json({ success:true, message: "Thrift category inserted successfully", data: newThriftCategory });
  } catch (error) {
    console.error("Error inserting Thrift category:", error);
    res.status(500).json({ success:false,message: "Error inserting Thrift category", error: error.message || error });
  }
};

export const getThriftCategory = async (req, res) => {
  try {  
    const data=await ThriftCategory.find({});
    res.status(201).json({ success:true, message: "Thrift category fetched successfully", data: data });
  } catch (error) {
    console.error("Error fetching Thrift category:", error);
    res.status(500).json({ success:false,message: "Error fetching Thrift category", error: error.message || error });
  }
};

export const EditThriftCategory = async (req, res) => {
  try {  
    const {name,id}=req.body;
    console.log(req.body)
    const data=await ThriftCategory.findById({_id:id})
    // console.log(data)
    const updatedData=await ThriftCategory.findByIdAndUpdate(id,{name:name},{new:true})
    res.status(201).json({ success:true, message: "Thrift category Edited successfully", data: updatedData });
  } catch (error) {
    console.error("Error Edited Thrift category:", error);
    res.status(500).json({ success:false,message: "Error Edited Thrift category", error: error.message || error });
  }
};

export const DeleteThriftCategory = async (req, res) => {
  try {  
    const {id}=req.params
    await ThriftCategory.findByIdAndDelete(id)
    res.status(201).json({ success:true, message: "Thrift category Deleting successfully" });
  } catch (error) {
    console.error("Error Deleting Thrift category:", error);
    res.status(500).json({ success:false,message: "Error Deleting Thrift category", error: error.message || error });
  }
};