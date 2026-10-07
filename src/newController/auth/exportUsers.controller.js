import Auth from "../../models/AuthModel/auth.model.js";

// Helper function to escape and quote CSV values according to RFC 4180
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  if (typeof val === "boolean") {
    return val ? '"Yes"' : '"No"';
  }
  if (val instanceof Date) {
    return `"${val.toISOString().replace("T", " ").substring(0, 19)}"`;
  }
  let str = String(val);
  // Double quote any internal quotation marks
  str = str.replace(/"/g, '""');
  return `"${str}"`;
};

export const exportUsersToCsv = async (req, res) => {
  try {
    // Fetch all users sorted by registration date descending, populate matrimony categories
    const users = await Auth.find({})
      .select("-password")
      .populate("allowedCategories", "name")
      .sort({ createdAt: -1 });

    const headers = [
      "S.No",
      "User ID",
      "Name",
      "Email",
      "Mobile Number",
      "Gender",
      "Age",
      "Date of Birth",
      "Blood Group",
      "Caste",
      "City",
      "Address",
      "Status",
      "Category",
      "All Categories Access",
      "Allowed Categories",
      "All Viewers Access",
      "Short Description",
      "Biodata File",
      "Resume File",
      "Profile Photo",
      "Registration Date",
      "Last Updated Date",
    ];

    const rows = users.map((u, index) => {
      // Date of birth
      let formattedDob = "";
      if (u.dob) {
        try {
          const d = new Date(u.dob);
          if (!isNaN(d.getTime())) {
            formattedDob = d.toISOString().split("T")[0];
          }
        } catch (_) {
          formattedDob = String(u.dob);
        }
      }

      // Category
      let categoryName = "";
      if (u.category) {
        if (typeof u.category === "object") {
          categoryName = u.category.name || u.category.title || JSON.stringify(u.category);
        } else {
          categoryName = String(u.category);
        }
      }

      // Allowed Categories
      let allowedCategoriesNames = "";
      if (Array.isArray(u.allowedCategories) && u.allowedCategories.length > 0) {
        allowedCategoriesNames = u.allowedCategories
          .map((c) => (c && typeof c === "object" && c.name ? c.name : String(c)))
          .join(", ");
      }

      // Registration Date
      let createdAtStr = "";
      if (u.createdAt) {
        try {
          createdAtStr = new Date(u.createdAt)
            .toISOString()
            .replace("T", " ")
            .substring(0, 19);
        } catch (_) {
          createdAtStr = String(u.createdAt);
        }
      }

      // Updated Date
      let updatedAtStr = "";
      if (u.updatedAt) {
        try {
          updatedAtStr = new Date(u.updatedAt)
            .toISOString()
            .replace("T", " ")
            .substring(0, 19);
        } catch (_) {
          updatedAtStr = String(u.updatedAt);
        }
      }

      return [
        escapeCsv(index + 1),
        escapeCsv(u._id),
        escapeCsv(u.username || ""),
        escapeCsv(u.email || ""),
        escapeCsv(u.mobileNumber || ""),
        escapeCsv(u.gender || ""),
        escapeCsv(u.age ?? ""),
        escapeCsv(formattedDob),
        escapeCsv(u.bloodGroup || ""),
        escapeCsv(u.caste || ""),
        escapeCsv(u.city || ""),
        escapeCsv(u.address || ""),
        escapeCsv(u.status || ""),
        escapeCsv(categoryName),
        escapeCsv(u.isAllCategories),
        escapeCsv(allowedCategoriesNames),
        escapeCsv(u.isAllViewers),
        escapeCsv(u.short_desc || ""),
        escapeCsv(u.biodata || ""),
        escapeCsv(u.resume || ""),
        escapeCsv(u.profile_photo || ""),
        escapeCsv(createdAtStr),
        escapeCsv(updatedAtStr),
      ].join(",");
    });

    const headerLine = headers.map((h) => `"${h}"`).join(",");
    const csvContent = [headerLine, ...rows].join("\r\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `bhartiy_users_${dateStr}.csv`;

    // Response headers
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    return res.status(200).send("\uFEFF" + csvContent);
  } catch (error) {
    console.error("Error exporting users CSV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export users data to CSV.",
      error: error.message || error,
    });
  }
};
