import { Router } from 'express';
import checkAuth from '../middleware/check-auth';
import { check } from 'express-validator';
import { list, add, findById, update, remove } from '../controllers/post';

const router = Router();

const checkPost = [check('title').not().isEmpty().isLength({ min: 1 }), check('content').not().isEmpty().isLength({ min: 1 })];

router.get('/', list);
router.get('/:id', findById);

router.post('/add', checkPost, checkAuth, add);
router.put('/update/:id', checkPost, checkAuth, update);
router.post('/remove', checkAuth, remove);

export default router;
