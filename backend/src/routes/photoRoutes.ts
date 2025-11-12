import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as photoController from '../controllers/photoController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { upload } from '../config/multer';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload photo
router.post(
  '/',
  upload.single('photo'),
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('groupId').isUUID().withMessage('Valid group ID is required'),
    body('latitude').optional().isFloat().withMessage('Latitude must be a number'),
    body('longitude').optional().isFloat().withMessage('Longitude must be a number'),
    body('takenAt').optional().isISO8601().withMessage('Invalid date format'),
  ]),
  photoController.uploadPhoto
);

// Get photos
router.get(
  '/',
  validate([
    query('groupId').isUUID().withMessage('Valid group ID is required'),
    query('status')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'RESOLVED', 'ARCHIVED'])
      .withMessage('Invalid status'),
    query('sortBy')
      .optional()
      .isIn(['uploadedAt', 'votes', 'takenAt'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Invalid sort order'),
  ]),
  photoController.getPhotos
);

// Get specific photo
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid photo ID')]),
  photoController.getPhoto
);

// Update photo
router.put(
  '/:id',
  validate([
    param('id').isUUID().withMessage('Invalid photo ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional(),
  ]),
  photoController.updatePhoto
);

// Update photo status (HOA admin only)
router.patch(
  '/:id/status',
  authorize('HOA_ADMIN'),
  validate([
    param('id').isUUID().withMessage('Invalid photo ID'),
    body('status')
      .isIn(['PENDING', 'APPROVED', 'RESOLVED', 'ARCHIVED'])
      .withMessage('Invalid status'),
  ]),
  photoController.updatePhotoStatus
);

// Delete photo
router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('Invalid photo ID')]),
  photoController.deletePhoto
);

// Serve photo file
router.get(
  '/:id/file',
  validate([
    param('id').isUUID().withMessage('Invalid photo ID'),
    query('thumbnail').optional().isBoolean().withMessage('Thumbnail must be boolean'),
  ]),
  photoController.servePhoto
);

export default router;
