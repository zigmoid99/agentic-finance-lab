import { Router } from 'express';
import { body, param } from 'express-validator';
import * as groupController from '../controllers/groupController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create group
router.post(
  '/',
  validate([
    body('name').notEmpty().withMessage('Group name is required'),
    body('description').optional(),
    body('communityAddress').optional(),
  ]),
  groupController.createGroup
);

// Get all user's groups
router.get('/', groupController.getGroups);

// Get specific group
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid group ID')]),
  groupController.getGroup
);

// Update group
router.put(
  '/:id',
  validate([
    param('id').isUUID().withMessage('Invalid group ID'),
    body('name').optional().notEmpty().withMessage('Group name cannot be empty'),
    body('description').optional(),
    body('communityAddress').optional(),
  ]),
  groupController.updateGroup
);

// Delete group
router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid group ID')]),
  groupController.deleteGroup
);

// Join group with invite code
router.post(
  '/join',
  validate([body('inviteCode').notEmpty().withMessage('Invite code is required')]),
  groupController.joinGroup
);

// Add member to group
router.post(
  '/:id/members',
  validate([
    param('id').isUUID().withMessage('Invalid group ID'),
    body('userEmail').isEmail().withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(['MEMBER', 'ADMIN'])
      .withMessage('Invalid role'),
  ]),
  groupController.addMember
);

// Remove member from group
router.delete(
  '/:id/members/:userId',
  validate([
    param('id').isUUID().withMessage('Invalid group ID'),
    param('userId').isUUID().withMessage('Invalid user ID'),
  ]),
  groupController.removeMember
);

// Get group members
router.get(
  '/:id/members',
  validate([param('id').isUUID().withMessage('Invalid group ID')]),
  groupController.getMembers
);

export default router;
