import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { signUpHustler , signInHustler , logoutHustler, refreshAccessToken} from '../controllers/authHustler.controller.js';
import { signUpClient } from '../controllers/authClient.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

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

router.route('/signinHustler').post(signInHustler) ;
router.route('/logoutHustler').post(verifyJWT , logoutHustler) ;
router.route('/refreshToken').post(refreshAccessToken) ;


export default router;