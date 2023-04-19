import { Router } from 'express';
import checkAuth from '../middleware/check-auth';
import upload from '../middleware/upload';
import { login, signup, signout, refresh, updateAvatar, me } from '../controllers/user';
import { check } from 'express-validator';

const router = Router();

const checkSignup = [
  check('email').not().isEmpty().isEmail(),
  check('name').not().isEmpty(),
  check('password').not().isEmpty(),
  check('repeatPassword').not().isEmpty(),
];

const checkLogin = [check('email').not().isEmpty()];

router.post('/login', checkLogin, upload.none(), login);
router.post('/signup', checkSignup, upload.none(), signup);
router.post('/signout', upload.none(), signout);
router.post('/refresh', upload.none(), refresh);

router.post('/updateAvatar', checkAuth, upload.single('image'), updateAvatar);
router.post('/me', checkAuth, upload.none(), me);

export default router;
