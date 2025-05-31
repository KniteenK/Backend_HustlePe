import express from "express";
import {
  createOrganization,
  findOrganization,
  deleteOrganization,
  editOrganization,
  organizationGigsGallery
} from "../controllers/organization.controller.js";

const router = express.Router();

router.post("/", createOrganization);
router.get("/", findOrganization);
router.delete("/:id", deleteOrganization);
router.put("/:id", editOrganization);
router.get("/:id/gigs", organizationGigsGallery);

export default router;