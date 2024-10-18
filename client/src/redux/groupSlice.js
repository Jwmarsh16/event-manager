import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper function to handle fetch requests with credentials
const fetchWithCredentials = (url, options = {}) => fetch(url, {
  ...options,
  credentials: 'include', // Ensure cookies are sent with the request
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
});

// Thunk to fetch all groups
export const fetchGroups = createAsyncThunk('groups/fetchGroups', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/groups');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch groups');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch groups');
  }
});

// Thunk to search groups by name
export const searchGroups = createAsyncThunk('groups/searchGroups', async (query, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/groups?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search groups');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching groups:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to search groups');
  }
});

// Thunk to fetch a specific group by ID
export const fetchGroupById = createAsyncThunk('groups/fetchGroupById', async (id, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/groups/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch group');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching group by ID:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch group');
  }
});

// Thunk to create a new group
export const createGroup = createAsyncThunk('groups/createGroup', async (groupData, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create group');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating group:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to create group');
  }
});

// Thunk to delete a group
export const deleteGroup = createAsyncThunk('groups/deleteGroup', async (groupId, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete group');
    }
    return { groupId };
  } catch (error) {
    console.error('Error deleting group:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to delete group');
  }
});

// Thunk to fetch group invitations
export const fetchGroupInvitations = createAsyncThunk('groups/fetchGroupInvitations', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/invitations');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch invitations');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch invitations');
  }
});

// Thunk to send a group invitation
export const sendGroupInvite = createAsyncThunk(
  'groups/sendGroupInvite',
  async ({ groupId, invitedUserId }, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({
          group_id: groupId,
          invited_user_id: invitedUserId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending group invitation:', error);
      return thunkAPI.rejectWithValue(error.message || 'Failed to send invitation');
    }
  }
);

// Thunk to accept a group invitation
export const acceptGroupInvite = createAsyncThunk('groups/acceptGroupInvite', async (inviteId, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/invitations/${inviteId}/accept`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to accept invitation');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to accept invitation');
  }
});

// Thunk to deny a group invitation
export const denyGroupInvite = createAsyncThunk('groups/denyGroupInvite', async (inviteId, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/invitations/${inviteId}/deny`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to deny invitation');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error denying invitation:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to deny invitation');
  }
});

const groupSlice = createSlice({
  name: 'groups',
  initialState: {
    groups: [],
    searchResults: [],
    currentGroup: null,
    invitations: [],
    loading: false,
    error: null,
    inviteStatus: null,
    inviteError: null,
  },
  reducers: {
    resetGroupState: (state) => {
      state.loading = false;
      state.error = null;
      state.inviteStatus = null;
      state.inviteError = null;
    },
    resetSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch groups';
      })

      .addCase(searchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search groups';
      })

      .addCase(fetchGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch group';
      })

      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.push(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create group';
      })

      .addCase(deleteGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = state.groups.filter(group => group.id !== action.payload.groupId);
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete group';
      })

      .addCase(sendGroupInvite.pending, (state) => {
        state.inviteStatus = null;
        state.inviteError = null;
        state.loading = true;
      })
      .addCase(sendGroupInvite.fulfilled, (state) => {
        state.inviteStatus = 'success';
        state.loading = false;
      })
      .addCase(sendGroupInvite.rejected, (state, action) => {
        state.inviteStatus = 'failed';
        state.inviteError = action.payload || 'Failed to send invitation';
        state.loading = false;
      })

      .addCase(fetchGroupInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupInvitations.fulfilled, (state, action) => {
        state.loading = false;
        state.invitations = action.payload;
      })
      .addCase(fetchGroupInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch invitations';
      })

      .addCase(acceptGroupInvite.pending, (state) => {
        state.inviteStatus = null;
        state.inviteError = null;
        state.loading = true;
      })
      .addCase(acceptGroupInvite.fulfilled, (state) => {
        state.inviteStatus = 'success';
        state.loading = false;
      })
      .addCase(acceptGroupInvite.rejected, (state, action) => {
        state.inviteStatus = 'failed';
        state.inviteError = action.payload || 'Failed to accept invitation';
        state.loading = false;
      })

      .addCase(denyGroupInvite.pending, (state) => {
        state.inviteStatus = null;
        state.inviteError = null;
        state.loading = true;
      })
      .addCase(denyGroupInvite.fulfilled, (state) => {
        state.inviteStatus = 'success';
        state.loading = false;
      })
      .addCase(denyGroupInvite.rejected, (state, action) => {
        state.inviteStatus = 'failed';
        state.inviteError = action.payload || 'Failed to deny invitation';
        state.loading = false;
      });
  },
});

export const { resetGroupState, resetSearchResults } = groupSlice.actions;
export default groupSlice.reducer;
