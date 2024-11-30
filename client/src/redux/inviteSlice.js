import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = (url, options = {}) => {
  const csrfToken = Cookies.get('csrf_access_token') || ''; // Handle missing cookies gracefully
  return fetch(url, {
    ...options,
    credentials: 'include', // Ensure cookies are sent with the request
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken, // Include CSRF token
      ...options.headers,
    },
  });
};

// Thunk to invite a user to an event
export const inviteUserToEvent = createAsyncThunk(
  'invites/inviteUserToEvent',
  async ({ eventId, invitedUserId }, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(`/api/events/${eventId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ invited_user_id: invitedUserId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to invite user');
      }
      const data = await response.json();
      return data; // Return the invitation details or success message
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to invite user');
    }
  }
);

// Slice for managing invitations
const inviteSlice = createSlice({
  name: 'invites',
  initialState: {
    invites: [], // List of invitations (if needed for tracking)
    loading: false,
    error: null,
    successMessage: null, // For storing success messages from the server
  },
  reducers: {
    resetInviteState: (state) => {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(inviteUserToEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(inviteUserToEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message; // Capture success message
        state.invites.push(action.payload.invitation); // Add the new invitation to the list
      })
      .addCase(inviteUserToEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to invite user';
      });
  },
});

// Export actions and reducer
export const { resetInviteState } = inviteSlice.actions;
export default inviteSlice.reducer;