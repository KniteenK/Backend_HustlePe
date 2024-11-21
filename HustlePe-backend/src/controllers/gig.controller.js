import { gigs } from "../models/gigs.model.js";
import apiResponse from "../utils/apiResponse.js";

const getGigs = async (req,res) => {
    const { skillsArray, sortBy = 'createdAt', order = -1, page = 1, limit = 10} = req.body;
    console.log (skillsArray, sortBy, order, page, limit);
    try {
      const sortOptions = {};
      sortOptions[sortBy] = order;
  
      const jobs = await gigs.find({ skills_req: { $in: skillsArray } }) 
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

        console.log(jobs);
  
      return res.status(200).json(
        new apiResponse(
          200,
          jobs,
          "Jobs fetched successfully",
        )
      );
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching jobs by skills and filter');
    }
};

export default getGigs;