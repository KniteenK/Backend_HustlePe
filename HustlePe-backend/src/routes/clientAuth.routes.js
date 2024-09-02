import express from "express";
import { signInClient , signOutClient , signUpClient , postGig } from "../controllers/authClient.controller.js"; 

const router = express.Router();

router.route('/postGig').post(postGig); ;

router.route('/signUpClient').post(signUpClient);

router.route('/signInClient').post(signInClient);

router.route('/signOutClient').post(signOutClient);

export default router;