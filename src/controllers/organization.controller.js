import { gigs } from "../models/gigs.model.js";
import { organization } from "../models/organization.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create organization
export const createOrganization = asyncHandler(async (req, res) => {
    const { name, description, founder, members = [] } = req.body;

    if (!name || !founder) {
        return res.status(400).json(new apiResponse(400, null, "Name and founder (hustler id) are required"));
    }

    // Check if organization with same name exists
    const existingOrg = await organization.findOne({ name });
    if (existingOrg) {
        return res.status(409).json(new apiResponse(409, null, "Organization with this name already exists"));
    }

    // Ensure founder is included as a member with position "Founder"
    const orgMembers = [
        { hustler: founder, position: "Founder" },
        ...members.filter(m => String(m.hustler) !== String(founder))
    ];

    const org = await organization.create({
        name,
        description,
        founder,
        members: orgMembers,
        rating: 0 // Initial rating
    });

    return res.status(201).json(new apiResponse(201, org, "Organization created successfully"));
});

// Find organization by ID or name
export const findOrganization = asyncHandler(async (req, res) => {
    const { id, name } = req.query;
    let org;

    if (id) {
        org = await organization.findById(id)
            .populate("founder", "username email")
            .populate("members.hustler", "username email");
    } else if (name) {
        org = await organization.findOne({ name })
            .populate("founder", "username email")
            .populate("members.hustler", "username email");
    } else {
        return res.status(400).json(new apiResponse(400, null, "Organization id or name required"));
    }

    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    return res.status(200).json(new apiResponse(200, org, "Organization found"));
});

// Find all organizations
export const findAllOrganizations = asyncHandler(async (req, res) => {
    const orgs = await organization.find()
        .populate("founder", "username email")
        .populate("members.hustler", "username email");
    return res.status(200).json(new apiResponse(200, orgs, "All organizations fetched successfully"));
});

// Delete organization by ID
export const deleteOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(new apiResponse(400, null, "Organization id required"));
    }
    const org = await organization.findByIdAndDelete(id);
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }
    return res.status(200).json(new apiResponse(200, org, "Organization deleted successfully"));
});

// Edit organization (name, description, members, etc.)
export const editOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, members } = req.body;
    if (!id) {
        return res.status(400).json(new apiResponse(400, null, "Organization id required"));
    }
    const update = {};
    if (name) update.name = name;
    if (description) update.description = description;
    if (Array.isArray(members)) update.members = members;

    const org = await organization.findByIdAndUpdate(id, update, { new: true })
        .populate("founder", "username email")
        .populate("members.hustler", "username email");
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }
    return res.status(200).json(new apiResponse(200, org, "Organization updated successfully"));
});

// Organization gigs gallery (current and past gigs, with ratings and amount)
export const organizationGigsGallery = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(new apiResponse(400, null, "Organization id required"));
    }
    // Find organization and its members' hustler IDs
    const org = await organization.findById(id).populate("members.hustler", "_id");
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }
    const hustlerIds = org.members.map(m => m.hustler._id);

    // Find gigs where assigned_hustler is in this organization
    const currentGigs = await gigs.find({
        assigned_hustler: { $in: hustlerIds },
        status: "open"
    }).select("title budget status assigned_hustler deadline payment_option milestones");

    const pastGigs = await gigs.find({
        assigned_hustler: { $in: hustlerIds },
        status: "closed"
    }).select("title budget status assigned_hustler deadline payment_option milestones");

    // Optionally, add ratings/amount info if you store it in the gig or related models

    return res.status(200).json(new apiResponse(200, {
        currentGigs,
        pastGigs
    }, "Organization gigs gallery fetched successfully"));
});

// Fetch all gigs posted
export const fetchAllGigs = asyncHandler(async (req, res) => {
    const allGigs = await gigs.find();
    return res.status(200).json(new apiResponse(200, allGigs, "All gigs fetched successfully"));
});
