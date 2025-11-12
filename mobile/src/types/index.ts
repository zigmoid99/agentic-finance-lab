export enum UserRole {
  RESIDENT = 'RESIDENT',
  HOA_ADMIN = 'HOA_ADMIN',
  CONTRACTOR = 'CONTRACTOR',
}

export enum GroupMemberRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

export enum PhotoStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export enum VoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  communityAddress?: string;
  inviteCode: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  members?: GroupMember[];
  _count?: {
    photos: number;
    members: number;
  };
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: GroupMemberRole;
  joinedAt: string;
  user: User;
}

export interface Photo {
  id: string;
  userId: string;
  groupId: string;
  title: string;
  description?: string;
  filePath: string;
  thumbnailPath?: string;
  fileSize: number;
  mimeType: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  takenAt?: string;
  uploadedAt: string;
  status: PhotoStatus;
  voteCount: number;
  user: User;
  group?: UserGroup;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  photoId: string;
  userId: string;
  voteType: VoteType;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
  details?: any;
}
