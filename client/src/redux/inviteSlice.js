import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function to fetch CSRF token before modifying requests
const fetchCSRFToken = async () => {
  await fetch('/csrf-token', { credentials: 'include' });
};

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = async (url, options = {}) => {
  const isModifyingRequest = ['POST', 'PUT', 'DELETE'].includes(options.method);

  // Fetch CSRF token before modifying requests
  if (isModifyingRequest) {
    await fetchCSRFToken();
  }

  const csrfToken = Cookies.get('csrf_access_token') || '';
  console.log('CSRF Token Sent:', csrfToken); // Debugging

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      ...options.headers,
    },
  });

  // Fetch a new CSRF token after modifying requests
  if (isModifyingRequest) {
    await fetchCSRFToken();
  }

  return response;
};

// 🔐 Invite User to an Event (CSRF Protected)
export const inviteUserToEvent = createAsyncThunk(
  'invites/inviteUserToEvent',
  async ({ eventId, invitedUserId }, thunkAPI) => {
    try {
      console.log('Inviting user to event:', eventId, invitedUserId);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials(
        `/api/events/${eventId}/invite`,
        {
          method: 'POST',
          body: JSON.stringify({ invited_user_id: invitedUserId }),
        },
      );

      if (!response.ok) throw new Error('Failed to invite user');

      const data = await response.json();
      return data.invitation;
    } catch (error) {
      console.error('Invite User Error:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Cancel an Event Invitation (CSRF Protected)
export const cancelEventInvite = createAsyncThunk(
  'invites/cancelEventInvite',
  async ({ id }, thunkAPI) => {
    try {
      console.log('Canceling event invite ID:', id);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials('/api/event_invitations', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to cancel invitation');

      return await response.json(); // Return the ID of the canceled invite
    } catch (error) {
      console.error('Cancel Event Invite Error:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔍 Fetch Invitations for a Specific Event (No CSRF Required, Read-Only)
export const fetchInvitationsForEvent = createAsyncThunk(
  'invites/fetchInvitationsForEvent',
  async (eventId, thunkAPI) => {
    try {
      console.log('Fetching invitations for event:', eventId);
      const response = await fetchWithCredentials(
        `/api/events/${eventId}/invitations`,
      );
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return await response.json();
    } catch (error) {
      console.error('Fetch invitations failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Invite Slice
const inviteSlice = createSlice({
  name: 'invites',
  initialState: {
    invites: [],
    eventInvitations: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    resetInviteState: (state) => {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
      state.eventInvitations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔐 Invite User to Event (CSRF Protected)
      .addCase(inviteUserToEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(inviteUserToEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'User invited successfully';
        state.invites.push(action.payload);
      })
      .addCase(inviteUserToEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to invite user';
      })

      // 🔐 Cancel Event Invitation (CSRF Protected)
      .addCase(cancelEventInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelEventInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'Invitation canceled successfully';

        if (action.payload && action.payload.id) {
          state.invites = state.invites.filter(
            (invite) => invite.id !== action.payload.id,
          );
        }
      })
      .addCase(cancelEventInvite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel invitation';
      })

      // 🔍 Fetch Invitations for Event (No CSRF Required, Read-Only)
      .addCase(fetchInvitationsForEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvitationsForEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.eventInvitations = action.payload;
      })
      .addCase(fetchInvitationsForEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch invitations for event';
      });
  },
});

// Export actions and reducer
export const { resetInviteState } = inviteSlice.actions;
export default inviteSlice.reducer;
