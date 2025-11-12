import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { photosApi } from '../../api/photos';
import { Photo, PhotoStatus } from '../../types';

interface PhotosState {
  photos: Photo[];
  currentPhoto: Photo | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

const initialState: PhotosState = {
  photos: [],
  currentPhoto: null,
  isLoading: false,
  isUploading: false,
  error: null,
};

export const fetchPhotos = createAsyncThunk(
  'photos/fetchPhotos',
  async (params: {
    groupId: string;
    status?: PhotoStatus;
    sortBy?: 'uploadedAt' | 'votes' | 'takenAt';
    order?: 'asc' | 'desc';
  }) => {
    const response = await photosApi.getPhotos(params);
    return response.photos;
  }
);

export const fetchPhoto = createAsyncThunk('photos/fetchPhoto', async (id: string) => {
  const response = await photosApi.getPhoto(id);
  return response.photo;
});

export const uploadPhoto = createAsyncThunk(
  'photos/uploadPhoto',
  async (data: {
    photo: { uri: string; type: string; name: string };
    title: string;
    description?: string;
    groupId: string;
    latitude?: number;
    longitude?: number;
    takenAt?: string;
  }) => {
    const response = await photosApi.uploadPhoto(data);
    return response.photo;
  }
);

export const castVote = createAsyncThunk(
  'photos/castVote',
  async (data: { photoId: string; voteType: 'UPVOTE' | 'DOWNVOTE' }) => {
    const response = await photosApi.castVote(data.photoId, data.voteType);
    return { photoId: data.photoId, vote: response.vote };
  }
);

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPhoto: (state, action) => {
      state.currentPhoto = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch photos
    builder.addCase(fetchPhotos.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPhotos.fulfilled, (state, action) => {
      state.isLoading = false;
      state.photos = action.payload;
    });
    builder.addCase(fetchPhotos.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch photos';
    });

    // Fetch single photo
    builder.addCase(fetchPhoto.fulfilled, (state, action) => {
      state.currentPhoto = action.payload;
    });

    // Upload photo
    builder.addCase(uploadPhoto.pending, (state) => {
      state.isUploading = true;
      state.error = null;
    });
    builder.addCase(uploadPhoto.fulfilled, (state, action) => {
      state.isUploading = false;
      state.photos.unshift(action.payload);
    });
    builder.addCase(uploadPhoto.rejected, (state, action) => {
      state.isUploading = false;
      state.error = action.error.message || 'Failed to upload photo';
    });

    // Cast vote
    builder.addCase(castVote.fulfilled, (state, action) => {
      const photoIndex = state.photos.findIndex((p) => p.id === action.payload.photoId);
      if (photoIndex !== -1) {
        // Update vote count (this is simplified, actual logic should be in backend)
        state.photos[photoIndex].voteCount += 1;
      }
    });
  },
});

export const { clearError, setCurrentPhoto } = photosSlice.actions;
export default photosSlice.reducer;
