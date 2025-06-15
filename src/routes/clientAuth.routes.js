import express from "express";
import { changeAddress, changeContactNumber, changeEmail, changeOrganisation, changePassword, changeUsername, fetchClientGigs, postGig, signOutClient, signUpClient, updateAvatar, updateCoverImage } from "../controllers/authClient.controller.js";
import { getGigsByClient } from "../controllers/gig.controller.js";
import signIn from "../controllers/signIn.controller.js";
import { verifyClientJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.route('/postGig').post(verifyClientJWT ,postGig);

router.route('/signUpClient').post(signUpClient);

router.route('/signInClient').post(signIn);

router.route('/signOutClient').post(verifyClientJWT, signOutClient);

router.route('/changePassword').patch(changePassword);

router.route('/changeEmail').patch(changeEmail);

router.route('/changeUsername').patch(changeUsername);

router.route('/changeAddress').patch(changeAddress);

router.route('/updateAvatar').patch(updateAvatar);

router.route('/updateCoverImage').patch(updateCoverImage);

router.route('/changeContactNumber').patch(changeContactNumber);

router.route('/changeOrganisation').patch(changeOrganisation);

router.route('/getGigs').get(getGigsByClient) ;

router.route('/myGigs').get(verifyClientJWT, fetchClientGigs);

export default router;