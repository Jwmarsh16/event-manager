import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = (url, options = {}) => {
  const csrfToken = Cookies.get('csrf_access_token') || ''; // Retrieve the latest CSRF token
  console.log('CSRF Token Sent:', csrfToken); // Debugging: Log the token being sent
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      ...options.headers,
    },
  });
};


// Thunks for group management
export const fetchGroups = createAsyncThunk('groups/fetchGroups', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/groups');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch groups');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch groups');
  }
});

export const searchGroups = createAsyncThunk('groups/searchGroups', async (query, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/groups?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search groups');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to search groups');
  }
});

export const fetchGroupById = createAsyncThunk('groups/fetchGroupById', async (id, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/groups/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch group');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch group');
  }
});

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

    // Fetch the newly created group for full details
    const createdGroup = await response.json();
    const groupResponse = await fetchWithCredentials(`/api/groups/${createdGroup.group.id}`);
    if (!groupResponse.ok) throw new Error('Failed to fetch newly created group');
    return await groupResponse.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to create group');
  }
});

export const deleteGroup = createAsyncThunk('groups/deleteGroup', async (groupId, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/groups/${groupId}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete group');
    }
    return { groupId };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to delete group');
  }
});

// Group invitations
export const fetchGroupInvitations = createAsyncThunk('groups/fetchGroupInvitations', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/invitations');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch invitations');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch invitations');
  }
});

export const sendGroupInvite = createAsyncThunk(
  'groups/sendGroupInvite',
  async ({ groupId, invitedUserId }, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ invited_user_id: invitedUserId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }
      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to send invitation');
    }
  }
);

export const acceptGroupInvite = createAsyncThunk('groups/acceptGroupInvite', async (inviteId, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/invitations/${inviteId}/accept`, { method: 'PUT' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to accept invitation');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to accept invitation');
  }
});

export const denyGroupInvite = createAsyncThunk('groups/denyGroupInvite', async (inviteId, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/invitations/${inviteId}/deny`, { method: 'PUT' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to deny invitation');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to deny invitation');
  }
});

// Group slice
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
        state.groups = state.groups.filter((group) => group.id !== action.payload.groupId);
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete group';
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

      .addCase(acceptGroupInvite.pending, (state) => {
        state.inviteStatus = null;
        state.inviteError = null;
        state.loading = true;
      })
      .addCase(acceptGroupInvite.fulfilled, (state, action) => {
        state.inviteStatus = 'success';
        state.loading = false;
        state.invitations = state.invitations.filter(
          (invitation) => invitation.id !== action.payload.id
        );
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
      .addCase(denyGroupInvite.fulfilled, (state, action) => {
        state.inviteStatus = 'success';
        state.loading = false;
        state.invitations = state.invitations.filter(
          (invitation) => invitation.id !== action.payload.id
        );
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
