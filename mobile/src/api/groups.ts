import apiClient from './client';
import { UserGroup, GroupMember } from '../types';

interface CreateGroupData {
  name: string;
  description?: string;
  communityAddress?: string;
}

interface UpdateGroupData {
  name?: string;
  description?: string;
  communityAddress?: string;
}

interface AddMemberData {
  userEmail: string;
  role?: string;
}

export const groupsApi = {
  getGroups: async (): Promise<{ groups: UserGroup[] }> => {
    const response = await apiClient.get('/groups');
    return response.data;
  },

  getGroup: async (id: string): Promise<{ group: UserGroup }> => {
    const response = await apiClient.get(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (data: CreateGroupData): Promise<{ group: UserGroup }> => {
    const response = await apiClient.post('/groups', data);
    return response.data;
  },

  updateGroup: async (id: string, data: UpdateGroupData): Promise<{ group: UserGroup }> => {
    const response = await apiClient.put(`/groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/groups/${id}`);
    return response.data;
  },

  joinGroup: async (inviteCode: string): Promise<{ membership: any }> => {
    const response = await apiClient.post('/groups/join', { inviteCode });
    return response.data;
  },

  getMembers: async (groupId: string): Promise<{ members: GroupMember[] }> => {
    const response = await apiClient.get(`/groups/${groupId}/members`);
    return response.data;
  },

  addMember: async (groupId: string, data: AddMemberData): Promise<{ membership: GroupMember }> => {
    const response = await apiClient.post(`/groups/${groupId}/members`, data);
    return response.data;
  },

  removeMember: async (groupId: string, userId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },
};
