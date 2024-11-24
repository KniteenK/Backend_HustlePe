import express from 'express';
import {
    applyToJob,
    changePassword,
    getUser,
    refreshAccessToken,
    signUpHustler,
    signOutHustler,
    updateAvatar,
    updateCoverImage
} from '../controllers/authHustler.controller.js';
import signIn from '../controllers/signIn.controller.js';
import { verifyHustlerJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import getGigs from '../controllers/gig.controller.js';

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

router.route('/updateAvatar').patch(updateAvatar);
router.route('/updateCoverImage').patch(updateCoverImage);
router.route('/changePassword').patch(changePassword);
router.route('/applyToJob').post(applyToJob);
router.route('/getUser').get(verifyHustlerJWT , getUser) ;

// get all the jobs or search with filters
router.route('/getGigs').post(getGigs) ;

export default router;