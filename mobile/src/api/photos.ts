import apiClient from './client';
import { Photo, PhotoStatus, VoteType } from '../types';

interface UploadPhotoData {
  photo: {
    uri: string;
    type: string;
    name: string;
  };
  title: string;
  description?: string;
  groupId: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
}

interface GetPhotosParams {
  groupId: string;
  status?: PhotoStatus;
  sortBy?: 'uploadedAt' | 'votes' | 'takenAt';
  order?: 'asc' | 'desc';
}

interface UpdatePhotoData {
  title?: string;
  description?: string;
}

export const photosApi = {
  uploadPhoto: async (data: UploadPhotoData): Promise<{ photo: Photo }> => {
    const formData = new FormData();
    formData.append('photo', data.photo as any);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('groupId', data.groupId);
    if (data.latitude) formData.append('latitude', data.latitude.toString());
    if (data.longitude) formData.append('longitude', data.longitude.toString());
    if (data.takenAt) formData.append('takenAt', data.takenAt);

    const response = await apiClient.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPhotos: async (params: GetPhotosParams): Promise<{ photos: Photo[] }> => {
    const response = await apiClient.get('/photos', { params });
    return response.data;
  },

  getPhoto: async (id: string): Promise<{ photo: Photo }> => {
    const response = await apiClient.get(`/photos/${id}`);
    return response.data;
  },

  updatePhoto: async (id: string, data: UpdatePhotoData): Promise<{ photo: Photo }> => {
    const response = await apiClient.put(`/photos/${id}`, data);
    return response.data;
  },

  updatePhotoStatus: async (id: string, status: PhotoStatus): Promise<{ photo: Photo }> => {
    const response = await apiClient.patch(`/photos/${id}/status`, { status });
    return response.data;
  },

  deletePhoto: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/photos/${id}`);
    return response.data;
  },

  getPhotoUrl: (id: string, thumbnail: boolean = false): string => {
    const baseUrl = apiClient.defaults.baseURL?.replace('/api', '');
    return `${baseUrl}/api/photos/${id}/file${thumbnail ? '?thumbnail=true' : ''}`;
  },

  castVote: async (photoId: string, voteType: VoteType): Promise<{ vote: any }> => {
    const response = await apiClient.post(`/photos/${photoId}/vote`, { voteType });
    return response.data;
  },

  removeVote: async (photoId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/photos/${photoId}/vote`);
    return response.data;
  },

  getVoteStats: async (photoId: string): Promise<{ stats: any }> => {
    const response = await apiClient.get(`/photos/${photoId}/votes`);
    return response.data;
  },
};
