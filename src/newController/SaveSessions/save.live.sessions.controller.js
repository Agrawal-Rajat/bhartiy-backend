import SaveLiveSessions from "../../models/SavedSessions/save.session.model.js"

const saveSession = async (req, res) => {
  try {
    const { link, role, title } = req.body;
    if (!title || !link) {
      return res.status(400).json({
        success: false,
        message: "Title and YouTube link/playlist are required",
      });
    }

    const data = await SaveLiveSessions.create({
      title: title.trim(),
      role: role || "khatushyam",
      link: link.trim(),
    });

    return res.status(200).json({
      success: true,
      message: `Saved Session added successfully`,
      data: data,
    });
  } catch (error) {
    console.error("Error in SavedSessionInsertController:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This video or playlist link already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getSavedSession = async (req, res) => {
  try {
    const { role } = req.query;
    var data;
    if (role == "admin") {
      data = await SaveLiveSessions.find({}).sort({ createdAt: -1 });
    } else {
      data = await SaveLiveSessions.find({ role: role }).sort({ createdAt: -1 });
    }
    return res.status(200).json({
      success: true,
      message: "SavedSession Fetched",
      data: data,
    });
  } catch (error) {
    console.error("Error in SavedSessionFetchController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const DeleteSavedSessions = async (req, res) => {
  try {
    const { id } = req.params;
    await SaveLiveSessions.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Saved Session deleted successfully",
    });
  } catch (error) {
    console.error("Error Deleting Saved Session:", error);
    res.status(500).json({
      success: false,
      message: "Error Deleting Saved Session",
      error: error.message || error,
    });
  }
};

const EditSavedSessionData = async (req, res) => {
  try {
    const { _id, title, link, role } = req.body;
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (link !== undefined) updatePayload.link = link.trim();
    if (role !== undefined) updatePayload.role = role;

    const updated = await SaveLiveSessions.findByIdAndUpdate(
      _id,
      updatePayload,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Saved Session updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating Saved Session:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This video or playlist link already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating Saved Session",
      error: error.message || error,
    });
  }
};

export {
  saveSession,
  getSavedSession,
  DeleteSavedSessions,
  EditSavedSessionData,
};