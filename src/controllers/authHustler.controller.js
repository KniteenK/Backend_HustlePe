import jwt from "jsonwebtoken";
import { Application } from "../models/application.model.js";
import { Hustler } from "../models/hustler.model.js";
import { Proposal } from "../models/proposal.model.js"; // You need to create this model
import { apiError } from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const signUpHustler = asyncHandler(async (req, res) => {
    const { username, email, password, first_name, last_name, contactNumber, address } = req.body;
    const { city, country } = address;

    if (
        [username, email, password, first_name, last_name, contactNumber, city, country].some((field) => field.trim() === "")
    ) {
        throw new apiError(400, "All fields are required");
    }

    const isExisting = await Hustler.findOne({
        $or: [{ username }, { email }]
    });

    if (isExisting) {
        throw new apiError(409, "Hustler already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let uploadedAvatar;
    if (avatarLocalPath) {
        uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
        if (!uploadedAvatar) {
            throw new apiError(500, "Failed to upload avatar");
        }
    }

    let uploadedCoverImage;
    if (coverImageLocalPath) {
        uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (!uploadedCoverImage) {
            throw new apiError(500, "Failed to upload cover image");
        }
    }

    const user = await Hustler.create({
        username: username.toLowerCase(),
        first_name,
        last_name,
        avatar: uploadedAvatar?.url || 'https://static.vecteezy.com/system/resources/thumbnails/027/951/137/small_2x/stylish-spectacles-guy-3d-avatar-character-illustrations-png.png',
        email,
        password,
        coverImage: uploadedCoverImage?.url || "",
        contactNumber,
        address: {
            city,
            country
        },
        role: "hustler",
        // overall_rating and gig_ratings will be set by default in schema
    });

    const isCreated = await Hustler.findById(user._id).select("-password -refreshToken");

    if (!isCreated) {
        throw new apiError(500, "Failed to create user");
    }

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(201).
    json(
        new apiResponse(200, isCreated, "User created successfully")
    )
    .cookies("refreshToken" , refreshToken , options)
    .cookies("accessToken" , accessToken , options)
})

const logoutHustler = asyncHandler(async(req, res) => {
    await Hustler.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        throw new apiError(401, "Unauthorized Request");
    }
    
   try {
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_REFRESH_TOKEN) ;
     
     const hustler = Hustler.findById(decodedToken?._id)
     
     if (!hustler) {
         throw new apiError(401, "Invalid Refresh Token");
     }
 
     if (decodedToken !== hustler?.refreshToken) {
         throw new apiError(401, "Refresh Token is expired");
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
 
     const token = await generateAccessToken(hustler._id) 
 
     return res.status(200)
     .cookies("refreshToken" , token)
     .json(
         new apiResponse(200, {
             accessToken: token
         }, "Access token refreshed successfully")
     )
   } catch (error) {
     throw new apiError(500, error?.message || "Failed to refresh access token");
   }
    
})

const changePassword = asyncHandler( async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    // Use req.user._id from middleware
    const user = await Hustler.findById(req.user._id);

    if (!user) {
        throw new apiError(404, "User not found");
    }

    const isPasswordMatch = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordMatch) {
        throw new apiError(401, "Invalid password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200)
    .json(
        new apiResponse(200, {}, "Password changed successfully")
    );
})

const getUser = asyncHandler (async (req , res) => {
    return res.status(200)
    .json(
        new apiResponse(200, req.user, "User details fetched successfully")
    )
})

const updateAvatar = asyncHandler (async (req , res) => {
    const avatarLocalPath = req.file?.path 
    console.log('avatarLocalPath', avatarLocalPath)
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required");
    }
    
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!uploadedAvatar) {
        throw new apiError(500, "Failed to upload avatar");
    }

    const user = await Hustler.findByIdAndUpdate(
        req.user._id, // Use ID from middleware
        {
            $set: {
                avatar: uploadedAvatar.url
            }
        },
        {
            new: true
        }
    ).select ("-password")

    return res.status(200)
    .json(
        new apiResponse(200, user, "Avatar updated successfully")
    )

})

const updateCoverImage = asyncHandler (async (req , res) => {
    const coverLocalPath = req.file?.path 

    if (!coverLocalPath) {
        throw new apiError(400, "Cover image is required");
    }
    
    const uploadedCover = await uploadOnCloudinary(coverLocalPath);

    if (!uploadedCover) {
        throw new apiError(500, "Failed to upload cover image");
    }

    const user = await Hustler.findByIdAndUpdate(
        req.user._id, // Use ID from middleware
        {
            $set: {
                coverImage: uploadedCover.url
            }
        },
        {
            new: true
        }
    ).select ("-password")

    return res.status(200)
    .json(
        new apiResponse(200, user, "Cover image updated successfully")
    )

})

// Controller for hustler to apply to a job/gig (using Proposal model)
const applyToJob = asyncHandler(async (req, res) => {
    const hustlerId = req.user._id;
    const {
        gig_id,
        cover_letter,
        expected_budget,
        budget_type, // "fixed", "hourly", "negotiable", etc.
        estimated_timeline, // e.g. "7 days", "2 weeks"
        availability, // e.g. "Immediate", "Next week"
        working_hours // e.g. "9am-5pm IST"
    } = req.body;

    if (!gig_id || !cover_letter) {
        throw new apiError(400, "Gig ID and cover letter are required");
    }

    // Prevent duplicate applications by the same hustler to the same gig
    const existing = await Proposal.findOne({ gig: gig_id, hustler: hustlerId });
    if (existing) {
        throw new apiError(409, "You have already applied to this job");
    }

    const proposal = await Proposal.create({
        gig: gig_id,
        hustler: hustlerId,
        cover_letter,
        expected_budget,
        budget_type,
        estimated_timeline,
        availability,
        working_hours,
        status: "pending"
    });

    if (!proposal) {
        throw new apiError(500, "Failed to apply to job");
    }

    return res.status(201).json(
        new apiResponse(201, proposal, "Applied to job successfully")
    );
});

// Accept a proposal (client accepts hustler's proposal)
const acceptProposal = asyncHandler(async (req, res) => {
    const { proposal_id } = req.body;
    if (!proposal_id) {
        throw new apiError(400, "Proposal ID is required");
    }

    const proposal = await Proposal.findById(proposal_id);
    if (!proposal) {
        throw new apiError(404, "Proposal not found");
    }

    proposal.status = "accepted";
    await proposal.save();

    // Optionally, assign hustler to gig here

    return res.status(200).json(
        new apiResponse(200, proposal, "Proposal accepted")
    );
});

   
const signOutHustler = asyncHandler(async (req, res) => {
       await Hustler.findByIdAndUpdate(
           req.user._id, // Use ID from middleware
           {
               $unset: {
                   accessToken: 1
               }
           },
           { 
               new: true  
           }
       )
       const options = {
           httpOnly: true,
           secure: true
       }
   
       return res
       .status(200)
       .clearCookie("accessToken", options)
       .clearCookie("refreshToken", options)
       .json(new apiResponse(200, {}, "User logged Out Successfully"))
   });

// View all proposals for a gig (with hustler avatar and info)
const getProposalsForGig = asyncHandler(async (req, res) => {
    const { gig_id } = req.params;
    if (!gig_id) {
        throw new apiError(400, "Gig ID is required");
    }

    const proposals = await Proposal.find({ gig: gig_id })
        .populate({
            path: "hustler",
            select: "username avatar first_name last_name rating skills"
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new apiResponse(200, proposals, "Proposals fetched successfully")
    );
});

export {
    acceptProposal,
    applyToJob,
    changePassword,
    getProposalsForGig,
    getUser,
    logoutHustler,
    refreshAccessToken,
    signOutHustler,
    signUpHustler,
    updateAvatar,
    updateCoverImage
};
