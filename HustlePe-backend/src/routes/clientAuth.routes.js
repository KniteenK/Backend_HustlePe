import express from "express";
import { signOutClient , signUpClient , postGig, changePassword , changeEmail , changeUsername, changeAddress, updateAvatar , updateCoverImage , changeContactNumber , changeOrganisation, } from "../controllers/authClient.controller.js"; 
import signIn from "../controllers/signIn.controller.js";
const router = express.Router();

router.route('/postGig').post(postGig);

router.route('/signUpClient').post(signUpClient);

router.route('/signInClient').post(signIn);

router.route('/signOutClient').post(signOutClient);

router.route('/changePassword').patch(changePassword);

router.route('/changeEmail').patch(changeEmail);

router.route('/changeUsername').patch(changeUsername);

router.route('/changeAddress').patch(changeAddress);

router.route('/updateAvatar').patch(updateAvatar);

router.route('/updateCoverImage').patch(updateCoverImage);

router.route('/changeContactNumber').patch(changeContactNumber);

router.route('/changeOrganisation').patch(changeOrganisation);
export default router;