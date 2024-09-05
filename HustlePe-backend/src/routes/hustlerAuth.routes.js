import express from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { signUpHustler , signInHustler , logoutHustler, refreshAccessToken} from '../controllers/authHustler.controller.js';
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


// Hustlers Routes
router.route('/signInHustler').post(signIn) ;
router.route('/logoutHustler').post(verifyHustlerJWT , logoutHustler) ;
router.route('/refreshToken').post(refreshAccessToken) ;

export default router;