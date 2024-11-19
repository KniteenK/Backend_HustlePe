import { gigs } from "../models/gigs.model.js";

const getGigs = async () => {
    const { skillsArray, sortBy = 'createdAt', order = -1, page = 1, limit = 10} = req.body;
    
    try {
      const sortOptions = {};
      sortOptions[sortBy] = order;
  
      const jobs = await gigs.find({ skills_req: { $in: skillsArray } }) 
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);
  
      return jobs;
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching jobs by skills and filter');
    }
};

export default getGigs;