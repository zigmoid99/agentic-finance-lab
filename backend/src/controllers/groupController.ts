import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, communityAddress } = req.body;
    const userId = req.user!.userId;

    const group = await prisma.userGroup.create({
      data: {
        name,
        description,
        communityAddress,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
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
        },
      },
    });

    res.status(201).json({
      message: 'Group created successfully',
      group,
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const groups = await prisma.userGroup.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
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
        },
        _count: {
          select: {
            photos: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to get groups' });
  }
};

export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const group = await prisma.userGroup.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
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
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, communityAddress } = req.body;
    const userId = req.user!.userId;

    // Check if user is admin of the group
    const membership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: id,
        userId,
        role: 'ADMIN',
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Only group admins can update the group' });
      return;
    }

    const group = await prisma.userGroup.update({
      where: { id },
      data: {
        name,
        description,
        communityAddress,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      message: 'Group updated successfully',
      group,
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if user is the creator of the group
    const group = await prisma.userGroup.findFirst({
      where: {
        id,
        createdById: userId,
      },
    });

    if (!group) {
      res.status(403).json({ error: 'Only the group creator can delete the group' });
      return;
    }

    await prisma.userGroup.delete({
      where: { id },
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user!.userId;

    // Find group by invite code
    const group = await prisma.userGroup.findUnique({
      where: { inviteCode },
    });

    if (!group) {
      res.status(404).json({ error: 'Invalid invite code' });
      return;
    }

    // Check if user is already a member
    const existingMembership = await prisma.userGroupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id,
        },
      },
    });

    if (existingMembership) {
      res.status(400).json({ error: 'You are already a member of this group' });
      return;
    }

    // Add user to group
    const membership = await prisma.userGroupMember.create({
      data: {
        userId,
        groupId: group.id,
        role: 'MEMBER',
      },
      include: {
        group: {
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Successfully joined group',
      membership,
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userEmail, role } = req.body;
    const userId = req.user!.userId;

    // Check if current user is admin
    const adminMembership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: id,
        userId,
        role: 'ADMIN',
      },
    });

    if (!adminMembership) {
      res.status(403).json({ error: 'Only group admins can add members' });
      return;
    }

    // Find user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!userToAdd) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user is already a member
    const existingMembership = await prisma.userGroupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userToAdd.id,
          groupId: id,
        },
      },
    });

    if (existingMembership) {
      res.status(400).json({ error: 'User is already a member of this group' });
      return;
    }

    // Add member
    const membership = await prisma.userGroupMember.create({
      data: {
        userId: userToAdd.id,
        groupId: id,
        role: role || 'MEMBER',
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

    res.status(201).json({
      message: 'Member added successfully',
      membership,
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId: memberUserId } = req.params;
    const userId = req.user!.userId;

    // Check if current user is admin
    const adminMembership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: id,
        userId,
        role: 'ADMIN',
      },
    });

    if (!adminMembership && userId !== memberUserId) {
      res.status(403).json({ error: 'Only group admins can remove members' });
      return;
    }

    // Cannot remove the group creator
    const group = await prisma.userGroup.findUnique({
      where: { id },
    });

    if (group?.createdById === memberUserId) {
      res.status(400).json({ error: 'Cannot remove the group creator' });
      return;
    }

    // Remove member
    await prisma.userGroupMember.delete({
      where: {
        userId_groupId: {
          userId: memberUserId,
          groupId: id,
        },
      },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

export const getMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if user is a member of the group
    const membership = await prisma.userGroupMember.findFirst({
      where: {
        groupId: id,
        userId,
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }

    const members = await prisma.userGroupMember.findMany({
      where: {
        groupId: id,
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
      orderBy: {
        joinedAt: 'asc',
      },
    });

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
};
