import { Router } from 'express';
import checkAuth from '../middleware/check-auth';
import { list, add, findById, update, remove } from '../controllers/post';

const router = Router();

router.get('/', list);
router.get('/:id', findById);

router.use(checkAuth);

router.post('/add', add);
router.post('/update', update);
router.post('/remove', remove);

export default router;
