import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { signUpHustler , signInHustler , logoutHustler, refreshAccessToken} from '../controllers/authHustler.controller.js';
import { signUpClient } from '../controllers/authClient.controller.js';
import { verifyHustlerJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/signUpClient').post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]) ,  signUpClient) ;


router.route('/signupHustler').post(signUpHustler) ;

// Hustlers Routes
router.route('/signinHustler').post(signInHustler) ;
router.route('/logoutHustler').post(verifyHustlerJWT , logoutHustler) ;
router.route('/refreshToken').post(refreshAccessToken) ;

// Clients Routes
// router.route('/signinClient').post(signInClient) ;
// router.route('/logoutClient').post(verifyJWT , LogOutClient) ;



export default router;