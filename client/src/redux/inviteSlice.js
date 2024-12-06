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
      console.log("Backend Response Data:", data); // Debugging
      return data.invitation; // Return the `invitation` object directly
    } catch (error) {
      console.error("Invite User Error:", error.message); // Debugging
      return thunkAPI.rejectWithValue(error.message || 'Failed to invite user');
    }
  }
);

// Thunk to cancel an invitation
export const cancelEventInvite = createAsyncThunk(
  'invites/cancelEventInvite',
  async ({ id }, thunkAPI) => {
    try {
      console.log("Cancel Event Invite Payload:", { id }); // Debugging
      const response = await fetchWithCredentials(`/api/event_invitations`, {
        method: 'DELETE',
        body: JSON.stringify({ id }), // Send the invitation ID
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel invitation');
      }
      const data = await response.json();
      console.log("Backend Cancel Response Data:", data); // Debugging
      return data; // Return the ID of the canceled invite
    } catch (error) {
      console.error("Cancel Event Invite Error:", error.message); // Debugging
      return thunkAPI.rejectWithValue(error.message || 'Failed to cancel invitation');
    }
  }
);

// Thunk to fetch all invitations for a specific event
export const fetchInvitationsForEvent = createAsyncThunk(
  'invites/fetchInvitationsForEvent',
  async (eventId, thunkAPI) => {
    try {
      console.log(`Fetching invitations for event ID: ${eventId}`);
      const response = await fetchWithCredentials(`/api/events/${eventId}/invitations`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching invitations:', errorData.message);
        throw new Error(errorData.message || 'Failed to fetch invitations');
      }
      return await response.json(); // Return the list of invitations
    } catch (error) {
      console.error('Fetch invitations failed:', error.message);
      return thunkAPI.rejectWithValue(error.message || 'Failed to fetch invitations');
    }
  }
);


// Slice for managing invitations
const inviteSlice = createSlice({
  name: 'invites',
  initialState: {
    invites: [],
    eventInvitations: [], // Store invitations for the current event
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
      // Invite User to Event
      .addCase(inviteUserToEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(inviteUserToEvent.fulfilled, (state, action) => {
        state.loading = false;
        console.log("Invite User Fulfilled Payload:", action.payload); // Debugging
        state.successMessage = 'User invited successfully'; // Set a fixed success message
        state.invites.push(action.payload); // Add the new invitation to the list
      })
      .addCase(inviteUserToEvent.rejected, (state, action) => {
        state.loading = false;
        console.error("Invite User Rejected:", action.payload); // Debugging
        state.error = action.payload || 'Failed to invite user';
      })

      // Cancel Invitation
      .addCase(cancelEventInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelEventInvite.fulfilled, (state, action) => {
        state.loading = false;
        console.log("Canceled Invitation Fulfilled Payload:", action.payload); // Debugging
        state.successMessage = 'Invitation canceled successfully'; // Set a fixed success message

        // Safeguard: Ensure `action.payload` has a valid structure
        if (action.payload && action.payload.id) {
          state.invites = state.invites.filter(
            (invite) => invite.id !== action.payload.id // Remove the canceled invite
          );
        } else {
          console.error("Invalid payload structure in cancelEventInvite:", action.payload);
        }
      })
      .addCase(cancelEventInvite.rejected, (state, action) => {
        state.loading = false;
        console.error("Cancel Invitation Rejected:", action.payload); // Debugging
        state.error = action.payload || 'Failed to cancel invitation';
      })
      // Fetch Invitations for Event
      .addCase(fetchInvitationsForEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvitationsForEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.eventInvitations = action.payload; // Update event invitations
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
