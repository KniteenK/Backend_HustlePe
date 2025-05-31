import { gigs } from "../models/gigs.model.js";
import apiResponse from "../utils/apiResponse.js";

const getGigs = async (req, res) => {
    const { skillsArray = [], sortBy = 'createdAt', order = -1, page = 1, limit = 100 } = req.body;
    console.log("Request Body:", req.body);
    console.log(skillsArray, sortBy, order, page, limit);

    try {
        const sortOptions = {};
        sortOptions[sortBy] = order;

        // Filter out empty strings from skillsArray
        const filteredSkillsArray = skillsArray.filter(skill => skill.trim() !== "");
        // console.log("Filtered Skills Array:", filteredSkillsArray);

        const query = filteredSkillsArray.length > 0 ? { skills_req: { $in: filteredSkillsArray } } : {};
        // console.log("Query:", query);

        const jobs = await gigs.find(query)
            .sort(sortOptions)
            // .skip((page - 1) * limit)
            // .limit(limit);

        // console.log("Fetched Jobs:", jobs);

        return res.status(200).json(
            new apiResponse(
                200,
                jobs,
                "Gigs fetched successfully"
            )
        );
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json(
            new apiResponse(
                500,
                null,
                "An error occurred while fetching gigs"
            )
        );
    }
};

// No changes needed for rating fields here

export default getGigs;