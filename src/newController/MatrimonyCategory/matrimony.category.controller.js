import MatrimonyCategory from "../../models/MatrimonyCategoryModel/matrimony.category.model.js";

export const insertMatrimonyCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }
    const newCategory = new MatrimonyCategory({ name: name.trim() });
    await newCategory.save();
    return res.status(201).json({
      success: true,
      message: "Matrimony category inserted successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error inserting matrimony category:", error);
    return res.status(500).json({
      success: false,
      message: "Error inserting matrimony category",
      error: error.message || error,
    });
  }
};

export const getMatrimonyCategory = async (req, res) => {
  try {
    const data = await MatrimonyCategory.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Matrimony category fetched successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching matrimony category:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching matrimony category",
      error: error.message || error,
    });
  }
};

export const EditMatrimonyCategory = async (req, res) => {
  try {
    const { name, id } = req.body;
    if (!id || !name) {
      return res.status(400).json({ success: false, message: "ID and name are required" });
    }
    const updatedData = await MatrimonyCategory.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Matrimony category edited successfully",
      data: updatedData,
    });
  } catch (error) {
    console.error("Error editing matrimony category:", error);
    return res.status(500).json({
      success: false,
      message: "Error editing matrimony category",
      error: error.message || error,
    });
  }
};

export const DeleteMatrimonyCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await MatrimonyCategory.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Matrimony category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting matrimony category:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting matrimony category",
      error: error.message || error,
    });
  }
};
