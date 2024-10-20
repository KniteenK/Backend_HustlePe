import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { signUpHustler , logoutHustler, refreshAccessToken,changePassword,
    getUser, 
    logoutHustler,
    refreshAccessToken, 
    signUpHustler, 
    updateAvatar,
    updateCoverImage,
    applyToJob}
    from '../controllers/authHustler.controller.js';
import { verifyHustlerJWT } from '../middlewares/auth.middleware.js';
import signIn from '../controllers/signIn.controller.js';

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
router.route('/logoutHustler').post(verifyHustlerJWT , logoutHustler) ;
router.route('/refreshToken').post(refreshAccessToken) ;

router.route('/updateAvatar').patch(updateAvatar);
router.route('/updateCoverImage').patch(updateCoverImage);
router.route('/changePassword').patch(changePassword);
router.route('/applyToJob').post(applyToJob);
router.route('/getUser').get(verifyHustlerJWT , getUser) ;


export default router;