import express from "express";
import {
    acceptProposal,
    changeAddress,
    changeContactNumber,
    changeEmail,
    changeOrganisation,
    changePassword,
    changeUsername,
    fetchClientGigs,
    getProposalsForJob,
    postGig,
    rejectProposal,
    selectHustler,
    signOutClient,
    signUpClient,
    updateAvatar,
    updateCoverImage,
} from "../controllers/authClient.controller.js";
import { getGigById, getGigsByClient } from "../controllers/gig.controller.js";
import signIn from "../controllers/signIn.controller.js";
import { verifyClientJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.route('/postGig').post(verifyClientJWT, postGig);

router.route('/signUpClient').post(signUpClient);

router.route('/signInClient').post(signIn);

router.route('/signOutClient').post(verifyClientJWT, signOutClient);

router.route('/changePassword').patch(verifyClientJWT, changePassword);

router.route('/changeEmail').patch(verifyClientJWT, changeEmail);

router.route('/changeUsername').patch(verifyClientJWT, changeUsername);

router.route('/changeAddress').patch(verifyClientJWT, changeAddress);

router.route('/updateAvatar').patch(verifyClientJWT, updateAvatar);

router.route('/updateCoverImage').patch(verifyClientJWT, updateCoverImage);

router.route('/changeContactNumber').patch(verifyClientJWT, changeContactNumber);

router.route('/changeOrganisation').patch(verifyClientJWT, changeOrganisation);

router.route('/getGigs').get(verifyClientJWT, getGigsByClient);

router.route('/myGigs').get(verifyClientJWT, fetchClientGigs);

// Register acceptProposal route
router.route('/accept-proposal').post(verifyClientJWT, acceptProposal);
router.route('/select-hustler').post(verifyClientJWT, selectHustler);

// Register getProposalsForJob route
router.route('/proposals/:gig_id').get(verifyClientJWT, getProposalsForJob);

// Register getGigById route
router.route('/gig/:gig_id').get(verifyClientJWT, getGigById);

// Register rejectProposal route
router.route('/reject-proposal').post(verifyClientJWT, rejectProposal);

export default router;