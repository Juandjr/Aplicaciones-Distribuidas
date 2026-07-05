const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = authMiddleware;

router.use(authMiddleware);
router.get('/', movieController.list);
router.get('/:id', movieController.getById);
router.post('/', requireRole('Admin'), movieController.create);
router.put('/:id', requireRole('Admin'), movieController.update);
router.delete('/:id', requireRole('Admin'), movieController.remove);
router.post('/:id/return', movieController.returnMovie);
router.post('/:id/rent', movieController.rent);

module.exports = router;
