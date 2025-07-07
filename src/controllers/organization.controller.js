import { gigs } from "../models/gigs.model.js";
import { Hustler } from "../models/hustler.model.js";
import { OrgApplication } from "../models/orgApplication.model.js";
import { organization } from "../models/organization.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create organization
export const createOrganization = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const founderId = req.user._id;

    if (!name) {
        return res.status(400).json(new apiResponse(400, null, "Organization name is required"));
    }

    // Check if user is already a founder or member of another organization
    const hustler = await Hustler.findById(founderId);
    if (hustler.current_organization) {
        return res.status(400).json(new apiResponse(400, null, "You are already part of an organization. Please leave your current organization first."));
    }

    // Check if organization with same name exists
    const existingOrg = await organization.findOne({ name });
    if (existingOrg) {
        return res.status(409).json(new apiResponse(409, null, "Organization with this name already exists"));
    }

    // Create organization with founder as the first member
    const org = await organization.create({
        name,
        description,
        founder: founderId,
        members: [{ hustler: founderId, position: "Founder" }],
        rating: 0
    });

    // Update founder's organization info
    await Hustler.findByIdAndUpdate(founderId, {
        current_organization: org._id,
        organization_position: 'Founder',
        organization_join_date: new Date()
    });

    const populatedOrg = await organization.findById(org._id)
        .populate("founder", "username email first_name last_name avatar")
        .populate("members.hustler", "username email first_name last_name avatar");

    return res.status(201).json(new apiResponse(201, populatedOrg, "Organization created successfully"));
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

// Get detailed organization information by ID
export const getOrganizationDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json(new apiResponse(400, null, "Organization ID is required"));
    }

    const org = await organization.findById(id)
        .populate("founder", "username email first_name last_name avatar")
        .populate("members.hustler", "username email first_name last_name avatar skills experience");

    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    // Get organization's current and past gigs
    const hustlerIds = org.members.map(m => m.hustler._id);
    const currentGigs = await gigs.find({
        assigned_hustler: { $in: hustlerIds },
        status: "open"
    }).select("title budget status deadline");

    const pastGigs = await gigs.find({
        assigned_hustler: { $in: hustlerIds },
        status: "closed"
    }).select("title budget status deadline");

    // Calculate organization stats
    const stats = {
        totalMembers: org.members.length,
        activeGigs: currentGigs.length,
        completedGigs: pastGigs.length,
        totalRevenue: pastGigs.reduce((sum, gig) => sum + (gig.budget || 0), 0)
    };

    const organizationData = {
        ...org.toObject(),
        currentGigs,
        pastGigs,
        stats
    };

    return res.status(200).json(new apiResponse(200, organizationData, "Organization details fetched successfully"));
});

// Apply to organization
export const applyToOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { application_message, desired_position } = req.body;
    const hustlerId = req.user._id;

    if (!application_message || !desired_position) {
        return res.status(400).json(new apiResponse(400, null, "Application message and desired position are required"));
    }

    // Check if hustler is already in an organization
    const hustler = await Hustler.findById(hustlerId);
    if (hustler.current_organization) {
        return res.status(400).json(new apiResponse(400, null, "You are already a member of an organization. Please leave your current organization first."));
    }

    // Check if organization exists
    const org = await organization.findById(organizationId);
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    // Check if user is the founder of this organization
    if (org.founder.toString() === hustlerId.toString()) {
        return res.status(400).json(new apiResponse(400, null, "You cannot apply to your own organization"));
    }

    // Check if already applied
    const existingApplication = await OrgApplication.findOne({
        hustler: hustlerId,
        organization: organizationId
    });

    if (existingApplication) {
        return res.status(400).json(new apiResponse(400, null, "You have already applied to this organization"));
    }

    // Create new application
    const application = await OrgApplication.create({
        hustler: hustlerId,
        organization: organizationId,
        application_message,
        desired_position
    });

    const populatedApplication = await OrgApplication.findById(application._id)
        .populate("hustler", "username email first_name last_name avatar skills")
        .populate("organization", "name description");

    return res.status(201).json(new apiResponse(201, populatedApplication, "Application submitted successfully"));
});

// Get applications for an organization (for organization founder/admins)
export const getOrganizationApplications = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const userId = req.user._id;

    // Check if user is the founder of the organization
    const org = await organization.findById(organizationId);
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    if (org.founder.toString() !== userId.toString()) {
        return res.status(403).json(new apiResponse(403, null, "Only organization founder can view applications"));
    }

    const applications = await OrgApplication.find({ organization: organizationId })
        .populate("hustler", "username email first_name last_name avatar skills experience")
        .sort({ applied_at: -1 });

    return res.status(200).json(new apiResponse(200, applications, "Applications fetched successfully"));
});

// Respond to application (accept/reject)
export const respondToApplication = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { status, response_message } = req.body;
    const userId = req.user._id;

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json(new apiResponse(400, null, "Status must be 'accepted' or 'rejected'"));
    }

    const application = await OrgApplication.findById(applicationId)
        .populate("organization")
        .populate("hustler");

    if (!application) {
        return res.status(404).json(new apiResponse(404, null, "Application not found"));
    }

    // Check if user is the founder of the organization
    if (application.organization.founder.toString() !== userId.toString()) {
        return res.status(403).json(new apiResponse(403, null, "Only organization founder can respond to applications"));
    }

    if (application.status !== 'pending') {
        return res.status(400).json(new apiResponse(400, null, "Application has already been responded to"));
    }

    // Update application
    application.status = status;
    application.response_message = response_message || '';
    application.responded_at = new Date();
    await application.save();

    // If accepted, add to organization and update hustler
    if (status === 'accepted') {
        // Check if hustler is already in another organization
        const hustler = await Hustler.findById(application.hustler._id);
        if (hustler.current_organization) {
            return res.status(400).json(new apiResponse(400, null, "Hustler is already a member of another organization"));
        }

        // Add to organization members
        await organization.findByIdAndUpdate(
            application.organization._id,
            {
                $push: {
                    members: {
                        hustler: application.hustler._id,
                        position: application.desired_position
                    }
                }
            }
        );

        // Update hustler's organization info
        await Hustler.findByIdAndUpdate(application.hustler._id, {
            current_organization: application.organization._id,
            organization_position: application.desired_position,
            organization_join_date: new Date()
        });
    }

    return res.status(200).json(new apiResponse(200, application, `Application ${status} successfully`));
});

// Get hustler's organization applications
export const getMyApplications = asyncHandler(async (req, res) => {
    const hustlerId = req.user._id;

    const applications = await OrgApplication.find({ hustler: hustlerId })
        .populate("organization", "name description founder")
        .sort({ applied_at: -1 });

    return res.status(200).json(new apiResponse(200, applications, "Your applications fetched successfully"));
});

// Leave organization
export const leaveOrganization = asyncHandler(async (req, res) => {
    const hustlerId = req.user._id;

    const hustler = await Hustler.findById(hustlerId);
    if (!hustler.current_organization) {
        return res.status(400).json(new apiResponse(400, null, "You are not a member of any organization"));
    }

    const org = await organization.findById(hustler.current_organization);
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    // Check if hustler is the founder
    if (org.founder.toString() === hustlerId.toString()) {
        return res.status(400).json(new apiResponse(400, null, "Founder cannot leave the organization. Please delete the organization or transfer ownership."));
    }

    // Remove from organization members
    await organization.findByIdAndUpdate(
        hustler.current_organization,
        {
            $pull: {
                members: { hustler: hustlerId }
            }
        }
    );

    // Update hustler's organization info
    await Hustler.findByIdAndUpdate(hustlerId, {
        current_organization: null,
        organization_position: '',
        organization_join_date: null
    });

    // Check if organization is empty and auto-delete
    await checkAndDeleteEmptyOrganization(hustler.current_organization);

    return res.status(200).json(new apiResponse(200, null, "Successfully left the organization"));
});

// Withdraw application
export const withdrawApplication = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const hustlerId = req.user._id;

    const application = await OrgApplication.findById(applicationId);
    if (!application) {
        return res.status(404).json(new apiResponse(404, null, "Application not found"));
    }

    // Check if the application belongs to the current user
    if (application.hustler.toString() !== hustlerId.toString()) {
        return res.status(403).json(new apiResponse(403, null, "You can only withdraw your own applications"));
    }

    // Check if application is still pending
    if (application.status !== 'pending') {
        return res.status(400).json(new apiResponse(400, null, "Can only withdraw pending applications"));
    }

    // Delete the application
    await OrgApplication.findByIdAndDelete(applicationId);

    return res.status(200).json(new apiResponse(200, null, "Application withdrawn successfully"));
});

// Get user's current organization (if they're a member or founder)
export const getMyOrganization = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const hustler = await Hustler.findById(userId);
    if (!hustler.current_organization) {
        return res.status(404).json(new apiResponse(404, null, "You are not part of any organization"));
    }

    const org = await organization.findById(hustler.current_organization)
        .populate("founder", "username email first_name last_name avatar")
        .populate("members.hustler", "username email first_name last_name avatar skills");

    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    // Get organization's current and past gigs
    const hustlerIds = org.members.map(m => m.hustler._id);
    const currentGigs = await gigs.find({
        assigned_hustler: { $in: hustlerIds },
        status: "open"
    }).select("title budget status deadline");

    const pastGigs = await gigs.find({
        assigned_hustler: { $in: hustlerIds },
        status: "closed"
    }).select("title budget status deadline");

    // Get pending applications if user is founder
    let pendingApplications = [];
    if (org.founder._id.toString() === userId.toString()) {
        pendingApplications = await OrgApplication.find({ 
            organization: org._id, 
            status: 'pending' 
        }).populate("hustler", "username email first_name last_name avatar skills");
    }

    const organizationData = {
        ...org.toObject(),
        currentGigs,
        pastGigs,
        pendingApplications,
        isFounder: org.founder._id.toString() === userId.toString(),
        userPosition: hustler.organization_position
    };

    return res.status(200).json(new apiResponse(200, organizationData, "Organization details fetched successfully"));
});

// Add member to organization (only for founders)
export const addMemberToOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { hustlerId, position } = req.body;
    const founderId = req.user._id;

    if (!hustlerId || !position) {
        return res.status(400).json(new apiResponse(400, null, "Hustler ID and position are required"));
    }

    // Check if user is the founder
    const org = await organization.findById(organizationId);
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    if (org.founder.toString() !== founderId.toString()) {
        return res.status(403).json(new apiResponse(403, null, "Only organization founder can add members"));
    }

    // Check if hustler exists and is not already in an organization
    const hustler = await Hustler.findById(hustlerId);
    if (!hustler) {
        return res.status(404).json(new apiResponse(404, null, "Hustler not found"));
    }

    if (hustler.current_organization) {
        return res.status(400).json(new apiResponse(400, null, "Hustler is already part of an organization"));
    }

    // Check if hustler is already a member
    const existingMember = org.members.find(m => m.hustler.toString() === hustlerId);
    if (existingMember) {
        return res.status(400).json(new apiResponse(400, null, "Hustler is already a member of this organization"));
    }

    // Add to organization
    await organization.findByIdAndUpdate(organizationId, {
        $push: { members: { hustler: hustlerId, position } }
    });

    // Update hustler's organization info
    await Hustler.findByIdAndUpdate(hustlerId, {
        current_organization: organizationId,
        organization_position: position,
        organization_join_date: new Date()
    });

    return res.status(200).json(new apiResponse(200, null, "Member added successfully"));
});

// Remove member from organization (only for founders)
export const removeMemberFromOrganization = asyncHandler(async (req, res) => {
    const { organizationId, hustlerId } = req.params;
    const founderId = req.user._id;

    // Check if user is the founder
    const org = await organization.findById(organizationId);
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    if (org.founder.toString() !== founderId.toString()) {
        return res.status(403).json(new apiResponse(403, null, "Only organization founder can remove members"));
    }

    // Can't remove the founder
    if (hustlerId === founderId.toString()) {
        return res.status(400).json(new apiResponse(400, null, "Founder cannot be removed from organization"));
    }

    // Remove from organization
    await organization.findByIdAndUpdate(organizationId, {
        $pull: { members: { hustler: hustlerId } }
    });

    // Update hustler's organization info
    await Hustler.findByIdAndUpdate(hustlerId, {
        current_organization: null,
        organization_position: '',
        organization_join_date: null
    });

    return res.status(200).json(new apiResponse(200, null, "Member removed successfully"));
});

// Delete organization (only for founders)
export const deleteOrganizationByFounder = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const founderId = req.user._id;

    // Check if user is the founder
    const org = await organization.findById(organizationId);
    if (!org) {
        return res.status(404).json(new apiResponse(404, null, "Organization not found"));
    }

    if (org.founder.toString() !== founderId.toString()) {
        return res.status(403).json(new apiResponse(403, null, "Only organization founder can delete the organization"));
    }

    // Update all members' organization info
    const memberIds = org.members.map(m => m.hustler);
    await Hustler.updateMany(
        { _id: { $in: memberIds } },
        {
            current_organization: null,
            organization_position: '',
            organization_join_date: null
        }
    );

    // Delete all pending applications
    await OrgApplication.deleteMany({ organization: organizationId });

    // Delete the organization
    await organization.findByIdAndDelete(organizationId);

    return res.status(200).json(new apiResponse(200, null, "Organization deleted successfully"));
});

// Auto-delete organization when last member leaves
export const checkAndDeleteEmptyOrganization = async (orgId) => {
    const org = await organization.findById(orgId);
    if (org && org.members.length === 0) {
        // Delete all pending applications
        await OrgApplication.deleteMany({ organization: orgId });
        // Delete the organization
        await organization.findByIdAndDelete(orgId);
        return true;
    }
    return false;
};
