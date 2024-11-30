import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = (url, options = {}) => {
  const csrfToken = Cookies.get('csrf_access_token') || ''; // Gracefully handle missing CSRF token
  return fetch(url, {
    ...options,
    credentials: 'include', // Ensure cookies are sent with the request
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken, // Add CSRF token to the headers
      ...options.headers,
    },
  });
};

// Thunk for fetching RSVPs for a specific event
export const fetchRSVPs = createAsyncThunk('rsvps/fetchRSVPs', async (eventId, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/events/${eventId}/rsvps`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch RSVPs');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch RSVPs');
  }
});

// Thunk for creating a new RSVP
export const createRSVP = createAsyncThunk('rsvps/createRSVP', async (rsvpData, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/rsvps', {
      method: 'POST',
      body: JSON.stringify(rsvpData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit RSVP');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to submit RSVP');
  }
});

// Thunk for updating an RSVP
export const updateRSVP = createAsyncThunk('rsvps/updateRSVP', async (rsvpData, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/rsvps', {
      method: 'PUT',
      body: JSON.stringify(rsvpData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update RSVP');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to update RSVP');
  }
});

// RSVP slice
const rsvpSlice = createSlice({
  name: 'rsvps',
  initialState: {
    rsvps: [], // List of RSVPs for the current event
    loading: false, // Loading state for RSVP-related actions
    error: null, // Error state
    successMessage: null, // Store success messages
  },
  reducers: {
    resetRsvpState: (state) => {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch RSVPs
      .addCase(fetchRSVPs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRSVPs.fulfilled, (state, action) => {
        state.loading = false;
        state.rsvps = action.payload;
      })
      .addCase(fetchRSVPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch RSVPs';
      })

      // Create RSVP
      .addCase(createRSVP.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createRSVP.fulfilled, (state, action) => {
        state.loading = false;
        state.rsvps.push(action.payload);
        state.successMessage = 'RSVP successfully created';
      })
      .addCase(createRSVP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to submit RSVP';
      })

      // Update RSVP
      .addCase(updateRSVP.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateRSVP.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.rsvps.findIndex((rsvp) => rsvp.id === action.payload.id);
        if (index !== -1) {
          state.rsvps[index] = action.payload;
        }
        state.successMessage = 'RSVP successfully updated';
      })
      .addCase(updateRSVP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update RSVP';
      });
  },
});

export const { resetRsvpState } = rsvpSlice.actions;
export default rsvpSlice.reducer;
