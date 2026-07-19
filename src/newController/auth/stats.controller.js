import Auth from "../../models/AuthModel/auth.model.js";
import Job from "../../models/JobsModel/job.model.js";
import Property from "../../models/Property/property.model.js";
import Thrift from "../../models/ThriftModel/thrift.model.js";
import Youth from "../../models/YouthModel/youth.model.js";

export const StatsConuts = async (req, res) => {
  try {
    const [
      totalUsersWithBiodata,
      totalJobs,
      totalProperties,
      totalThrift,
      totalYouth
    ] = await Promise.all([
      // Auth: only users having biodata
      Auth.countDocuments({
        biodata: { $exists: true, $ne: "" }
      }),

      Job.countDocuments({}),
      Property.countDocuments({}),
      Thrift.countDocuments({}),
      Youth.countDocuments({})
    ]);

    return res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      data: {
        usersWithBiodata: totalUsersWithBiodata,
        jobs: totalJobs,
        properties: totalProperties,
        thriftProducts: totalThrift,
        youthContent: totalYouth
      }
    });

  } catch (error) {
    console.error("Error in StatsCountController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
