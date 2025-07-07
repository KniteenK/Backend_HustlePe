import express from "express";
import {
    addMemberToOrganization,
    applyToOrganization,
    createOrganization,
    deleteOrganization,
    deleteOrganizationByFounder,
    editOrganization,
    fetchAllGigs,
    findAllOrganizations,
    findOrganization,
    getMyApplications,
    getMyOrganization,
    getOrganizationApplications,
    getOrganizationDetails,
    leaveOrganization,
    organizationGigsGallery,
    removeMemberFromOrganization,
    respondToApplication,
    withdrawApplication
} from "../controllers/organization.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", verifyJWT, createOrganization);
router.get("/", findOrganization);
router.get("/all", findAllOrganizations);
router.get("/gigs/all", fetchAllGigs);
router.delete("/:id", deleteOrganization);
router.put("/:id", editOrganization);
router.get("/:id/gigs", organizationGigsGallery);

// New routes for organization details and applications
router.get("/:id/details", getOrganizationDetails);
router.post("/:organizationId/apply", verifyJWT, applyToOrganization);
router.get("/:organizationId/applications", verifyJWT, getOrganizationApplications);
router.put("/application/:applicationId/respond", verifyJWT, respondToApplication);
router.get("/my-applications", verifyJWT, getMyApplications);
router.delete("/application/:applicationId/withdraw", verifyJWT, withdrawApplication);

// Organization management routes
router.get("/my-organization", verifyJWT, getMyOrganization);
router.post("/:organizationId/add-member", verifyJWT, addMemberToOrganization);
router.delete("/:organizationId/remove-member/:hustlerId", verifyJWT, removeMemberFromOrganization);
router.delete("/:organizationId/delete", verifyJWT, deleteOrganizationByFounder);
router.post("/leave", verifyJWT, leaveOrganization);

export default router;