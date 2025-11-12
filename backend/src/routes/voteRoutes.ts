import { Router } from 'express';
import { body, param } from 'express-validator';
import * as voteController from '../controllers/voteController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Cast or update vote
router.post(
  '/:id/vote',
  validate([
    param('id').isUUID().withMessage('Invalid photo ID'),
    body('voteType')
      .isIn(['UPVOTE', 'DOWNVOTE'])
      .withMessage('Vote type must be UPVOTE or DOWNVOTE'),
  ]),
  voteController.castVote
);

// Remove vote
router.delete(
  '/:id/vote',
  validate([param('id').isUUID().withMessage('Invalid photo ID')]),
  voteController.removeVote
);

// Get vote statistics
router.get(
  '/:id/votes',
  validate([param('id').isUUID().withMessage('Invalid photo ID')]),
  voteController.getVoteStats
);

export default router;
