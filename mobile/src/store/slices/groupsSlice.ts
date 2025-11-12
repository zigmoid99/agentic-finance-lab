import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { groupsApi } from '../../api/groups';
import { UserGroup } from '../../types';

interface GroupsState {
  groups: UserGroup[];
  currentGroup: UserGroup | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,
};

export const fetchGroups = createAsyncThunk('groups/fetchGroups', async () => {
  const response = await groupsApi.getGroups();
  return response.groups;
});

export const fetchGroup = createAsyncThunk('groups/fetchGroup', async (id: string) => {
  const response = await groupsApi.getGroup(id);
  return response.group;
});

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (data: { name: string; description?: string; communityAddress?: string }) => {
    const response = await groupsApi.createGroup(data);
    return response.group;
  }
);

export const joinGroup = createAsyncThunk('groups/joinGroup', async (inviteCode: string) => {
  const response = await groupsApi.joinGroup(inviteCode);
  return response.membership;
});

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch groups
    builder.addCase(fetchGroups.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchGroups.fulfilled, (state, action) => {
      state.isLoading = false;
      state.groups = action.payload;
    });
    builder.addCase(fetchGroups.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch groups';
    });

    // Fetch single group
    builder.addCase(fetchGroup.fulfilled, (state, action) => {
      state.currentGroup = action.payload;
    });

    // Create group
    builder.addCase(createGroup.fulfilled, (state, action) => {
      state.groups.push(action.payload);
    });

    // Join group
    builder.addCase(joinGroup.fulfilled, (state, action) => {
      // Refresh groups after joining
    });
  },
});

export const { clearError, setCurrentGroup } = groupsSlice.actions;
export default groupsSlice.reducer;
