import express from 'express';
import {
    acceptProposal,
    applyToJob,
    changePassword,
    getProposalsForGig,
    getUser,
    refreshAccessToken,
    getAssignedGigsForHustler,
    signOutHustler,
    signUpHustler,
    updateAvatar,
    updateCoverImage
} from '../controllers/authHustler.controller.js';
import getGigs from '../controllers/gig.controller.js';
import signIn from '../controllers/signIn.controller.js';
import { verifyHustlerJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.route('/signUpHustler').post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]) ,  signUpHustler) ;


//     getUser, 
//     applyToJob

// Hustlers Routes
router.route('/signInHustler').post(signIn) ;
router.route('/signOutHustler').post(verifyHustlerJWT , signOutHustler) ;
router.route('/refreshToken').post(refreshAccessToken) ;
router.route('/getAssignedGigs').post(getAssignedGigsForHustler) ;
router.route('/updateAvatar').patch(verifyHustlerJWT, updateAvatar);
router.route('/updateCoverImage').patch(verifyHustlerJWT, updateCoverImage);
router.route('/changePassword').patch(verifyHustlerJWT, changePassword);
router.route('/applyToJob').post(verifyHustlerJWT, applyToJob);
router.route('/getUser').get(verifyHustlerJWT , getUser) ;

// New: Accept a proposal (for client/hustler)
router.route('/acceptProposal').post(verifyHustlerJWT, acceptProposal);

// New: Get all proposals for a gig (for hustler)
router.route('/proposals/:gig_id').get(verifyHustlerJWT, getProposalsForGig);

// get all the jobs or search with filters
router.route('/getGigs').post(getGigs) ;

export default router;