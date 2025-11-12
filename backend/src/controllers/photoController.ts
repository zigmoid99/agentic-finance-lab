import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { extractMetadata, createThumbnail, deleteFile } from '../utils/imageProcessor';
import path from 'path';

export const uploadPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { title, description, groupId, latitude, longitude, takenAt } = req.body;
    const userId = req.user!.userId;

    // Check if user is a member of the group
    const membership = await prisma.userGroupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      // Delete uploaded file
      await deleteFile(req.file.path);
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    // Extract metadata from image
    const metadata = await extractMetadata(req.file.path);

    // Create thumbnail
    let thumbnailPath: string | undefined;
    try {
      thumbnailPath = await createThumbnail(req.file.path);
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
    }

    // Use provided coordinates or fall back to EXIF data
    const finalLatitude = latitude ? parseFloat(latitude) : metadata.latitude;
    const finalLongitude = longitude ? parseFloat(longitude) : metadata.longitude;
    const finalTakenAt = takenAt ? new Date(takenAt) : metadata.takenAt;

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        userId,
        groupId,
        title,
        description,
        filePath: req.file.path,
        thumbnailPath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        latitude: finalLatitude,
        longitude: finalLongitude,
        takenAt: finalTakenAt,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo,
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    // Clean up file if database operation fails
    if (req.file) {
      await deleteFile(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

export const getPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupId, status, sortBy = 'uploadedAt', order = 'desc' } = req.query;
    const userId = req.user!.userId;

    if (!groupId) {
      res.status(400).json({ error: 'Group ID is required' });
      return;
    }

    // Check if user is a member of the group
    const membership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: groupId as string,
        userId,
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    const where: any = {
      groupId: groupId as string,
    };

    if (status) {
      where.status = status;
    }

    const orderBy: any = {};
    if (sortBy === 'votes') {
      orderBy.voteCount = order;
    } else {
      orderBy[sortBy as string] = order;
    }

    const photos = await prisma.photo.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy,
    });

    res.json({ photos });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
};

export const getPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        votes: {
          select: {
            id: true,
            userId: true,
            voteType: true,
          },
        },
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    // Check if user is a member of the group
    const membership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: photo.groupId,
        userId,
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    res.json({ photo });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to get photo' });
  }
};

export const updatePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user!.userId;

    // Check if user owns the photo
    const photo = await prisma.photo.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found or you do not have permission' });
      return;
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: {
        title,
        description,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json({
      message: 'Photo updated successfully',
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
};

export const updatePhotoStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Only HOA_ADMIN can update photo status
    if (userRole !== 'HOA_ADMIN') {
      res.status(403).json({ error: 'Only HOA admins can update photo status' });
      return;
    }

    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    // Check if user is HOA admin in the group
    const membership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: photo.groupId,
        userId,
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json({
      message: 'Photo status updated successfully',
      photo: updatedPhoto,
    });
  } catch (error) {
    console.error('Update photo status error:', error);
    res.status(500).json({ error: 'Failed to update photo status' });
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if user owns the photo
    const photo = await prisma.photo.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found or you do not have permission' });
      return;
    }

    // Delete files
    await deleteFile(photo.filePath);
    if (photo.thumbnailPath) {
      await deleteFile(photo.thumbnailPath);
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id },
    });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

export const servePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { thumbnail } = req.query;
    const userId = req.user!.userId;

    const photo = await prisma.photo.findUnique({
      where: { id },
      select: {
        filePath: true,
        thumbnailPath: true,
        groupId: true,
        mimeType: true,
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    // Check if user is a member of the group
    const membership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: photo.groupId,
        userId,
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    const filePath = thumbnail === 'true' && photo.thumbnailPath
      ? photo.thumbnailPath
      : photo.filePath;

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Serve photo error:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
};
