import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const castVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: photoId } = req.params;
    const { voteType } = req.body;
    const userId = req.user!.userId;

    // Check if photo exists and user is a member of the group
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        group: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    if (photo.group.members.length === 0) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        photoId_userId: {
          photoId,
          userId,
        },
      },
    });

    let vote;
    let voteCountChange = 0;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Same vote type - do nothing or return existing vote
        res.json({
          message: 'Vote already cast',
          vote: existingVote,
        });
        return;
      } else {
        // Different vote type - update the vote
        vote = await prisma.vote.update({
          where: {
            photoId_userId: {
              photoId,
              userId,
            },
          },
          data: {
            voteType,
          },
        });

        // If changing from UPVOTE to DOWNVOTE: -2, vice versa: +2
        voteCountChange = voteType === 'UPVOTE' ? 2 : -2;
      }
    } else {
      // Create new vote
      vote = await prisma.vote.create({
        data: {
          photoId,
          userId,
          voteType,
        },
      });

      // New upvote: +1, new downvote: -1
      voteCountChange = voteType === 'UPVOTE' ? 1 : -1;
    }

    // Update photo vote count
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        voteCount: {
          increment: voteCountChange,
        },
      },
    });

    res.json({
      message: existingVote ? 'Vote updated successfully' : 'Vote cast successfully',
      vote,
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
};

export const removeVote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: photoId } = req.params;
    const userId = req.user!.userId;

    // Find existing vote
    const vote = await prisma.vote.findUnique({
      where: {
        photoId_userId: {
          photoId,
          userId,
        },
      },
    });

    if (!vote) {
      res.status(404).json({ error: 'Vote not found' });
      return;
    }

    // Delete vote
    await prisma.vote.delete({
      where: {
        photoId_userId: {
          photoId,
          userId,
        },
      },
    });

    // Update photo vote count
    const voteCountChange = vote.voteType === 'UPVOTE' ? -1 : 1;
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        voteCount: {
          increment: voteCountChange,
        },
      },
    });

    res.json({ message: 'Vote removed successfully' });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
};

export const getVoteStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: photoId } = req.params;
    const userId = req.user!.userId;

    // Check if photo exists and user is a member of the group
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        group: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    if (photo.group.members.length === 0) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    // Get vote statistics
    const [upvotes, downvotes, userVote] = await Promise.all([
      prisma.vote.count({
        where: {
          photoId,
          voteType: 'UPVOTE',
        },
      }),
      prisma.vote.count({
        where: {
          photoId,
          voteType: 'DOWNVOTE',
        },
      }),
      prisma.vote.findUnique({
        where: {
          photoId_userId: {
            photoId,
            userId,
          },
        },
      }),
    ]);

    res.json({
      stats: {
        upvotes,
        downvotes,
        totalVotes: upvotes - downvotes,
        userVote: userVote?.voteType || null,
      },
    });
  } catch (error) {
    console.error('Get vote stats error:', error);
    res.status(500).json({ error: 'Failed to get vote statistics' });
  }
};
