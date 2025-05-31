import express from "express";
import {
    createOrganization,
    deleteOrganization,
    editOrganization,
    findAllOrganizations,
    findOrganization,
    organizationGigsGallery
} from "../controllers/organization.controller.js";

const router = express.Router();

router.post("/", createOrganization);
router.get("/", findOrganization);
router.get("/all", findAllOrganizations);
router.delete("/:id", deleteOrganization);
router.put("/:id", editOrganization);
router.get("/:id/gigs", organizationGigsGallery);

export default router;