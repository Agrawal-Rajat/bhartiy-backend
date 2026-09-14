import Admin from "../../models/AuthModel/admin.model.js";
import bcrypt from "bcryptjs";

// Create a new Sub-Admin (restricted to matrimony & matrimony_category)
export const createSubAdmin = async (req, res) => {
  try {
    const { username, email, password, permissions } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An admin or sub-admin with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const subadminPermissions =
      Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : ["matrimony", "matrimony_category"];

    const subAdmin = await Admin.create({
      username: username.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: "subadmin",
      permissions: subadminPermissions,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Sub-admin created successfully",
      data: {
        _id: subAdmin._id,
        username: subAdmin.username,
        email: subAdmin.email,
        role: subAdmin.role,
        permissions: subAdmin.permissions,
        status: subAdmin.status,
        createdAt: subAdmin.createdAt,
      },
    });
  } catch (error) {
    console.error("createSubAdmin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get all Sub-Admins
export const getAllSubAdmins = async (req, res) => {
  try {
    const subadmins = await Admin.find({ role: "subadmin" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: subadmins || [],
    });
  } catch (error) {
    console.error("getAllSubAdmins Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Delete a Sub-Admin
export const deleteSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const subAdmin = await Admin.findById(id);
    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: "Sub-admin not found",
      });
    }

    // Safety guard: ensure only subadmins can be deleted
    if (subAdmin.role !== "subadmin") {
      return res.status(403).json({
        success: false,
        message: "Primary admin accounts cannot be deleted",
      });
    }

    await Admin.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Sub-admin deleted successfully",
    });
  } catch (error) {
    console.error("deleteSubAdmin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Toggle Sub-Admin status (active / inactive)
export const toggleSubAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const subAdmin = await Admin.findById(id);
    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: "Sub-admin not found",
      });
    }

    if (subAdmin.role !== "subadmin") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify primary admin status",
      });
    }

    subAdmin.status = subAdmin.status === "active" ? "inactive" : "active";
    await subAdmin.save();

    return res.status(200).json({
      success: true,
      message: `Sub-admin status changed to ${subAdmin.status}`,
      data: {
        _id: subAdmin._id,
        status: subAdmin.status,
      },
    });
  } catch (error) {
    console.error("toggleSubAdminStatus Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
