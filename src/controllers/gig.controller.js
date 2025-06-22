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

        console.log("Filtered Skills Array:", filteredSkillsArray);
        console.log("Query:", query);

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

export const getGigsByClient = async (req, res) => {
  try {
      const { client_id } = req.body;

      // Validate that client_id is provided
      if (!client_id) {
          return res.status(400).json({ error: 'Client ID is required' });
      }

      // Find gigs by the given client_id
      const clientGigs = await gigs.find({ client_id });

      // If no gigs are found, return a message
      if (clientGigs.length === 0) {
          return res.status(404).json({ message: 'No gigs found for this client' });
      }

      // Return the gigs
      return res.status(200).json(clientGigs);
  } catch (error) {
      console.error('Error fetching gigs by client:', error);
      return res.status(500).json({ error: 'Server error' });
  }
};

export const getGigById = async (req, res) => {
    try {
        const { gig_id } = req.params;
        if (!gig_id) {
            return res.status(400).json({ error: 'Gig ID is required' });
        }

        const gig = await gigs.findById(gig_id);
        if (!gig) {
            return res.status(404).json({ error: 'Gig not found' });
        }

        return res.status(200).json(
            new apiResponse(
                200,
                gig,
                "Gig fetched successfully"
            )
        );
    } catch (error) {
        console.error("Error fetching gig by id:", error);
        return res.status(500).json(
            new apiResponse(
                500,
                null,
                "An error occurred while fetching the gig"
            )
        );
    }
};

export default getGigs;