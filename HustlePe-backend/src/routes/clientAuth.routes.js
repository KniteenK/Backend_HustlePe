import express from "express";
import { signOutClient , signUpClient , postGig } from "../controllers/authClient.controller.js"; 
import signIn from "../controllers/signIn.controller.js";
const router = express.Router();

router.route('/postGig').post(postGig);

router.route('/signUpClient').post(signUpClient);


router.route('/signInClient').post(signIn);

router.route('/signOutClient').post(signOutClient);

export default router;