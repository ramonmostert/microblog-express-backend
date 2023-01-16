import { Router } from 'express';
// import checkAuth from '../middleware/check-auth';

import { login, signup, signout, refresh } from '../controllers/user';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/signout', signout);
router.post('/refresh', refresh);

// router.use(checkAuth);

export default router;
