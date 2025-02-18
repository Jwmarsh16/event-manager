import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function to fetch CSRF token before modifying requests
const fetchCSRFToken = async () => {
  await fetch('/csrf-token', { credentials: 'include' });
};

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = async (url, options = {}) => {
  if (['POST', 'PUT', 'DELETE'].includes(options.method)) {
    await fetchCSRFToken(); // Ensure CSRF token is refreshed
  }

  const csrfToken = Cookies.get('csrf_access_token') || ''; // Retrieve latest CSRF token
  console.log('CSRF Token Sent:', csrfToken); // Debugging

  return fetch(url, {
    ...options,
    credentials: 'include', // Ensure cookies are sent with the request
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken, // Add CSRF token to headers
      ...options.headers,
    },
  });
};

// 🔍 Fetch RSVPs for a specific event (No CSRF Required, Read-Only)
export const fetchRSVPs = createAsyncThunk(
  'rsvps/fetchRSVPs',
  async (eventId, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(
        `/api/events/${eventId}/rsvps`,
      );
      if (!response.ok) throw new Error('Failed to fetch RSVPs');
      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Create a new RSVP (CSRF Protected)
export const createRSVP = createAsyncThunk(
  'rsvps/createRSVP',
  async (rsvpData, thunkAPI) => {
    try {
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials('/api/rsvps', {
        method: 'POST',
        body: JSON.stringify(rsvpData),
      });

      if (!response.ok) throw new Error('Failed to submit RSVP');

      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Update an RSVP (CSRF Protected)
export const updateRSVP = createAsyncThunk(
  'rsvps/updateRSVP',
  async (rsvpData, thunkAPI) => {
    try {
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials('/api/rsvps', {
        method: 'PUT',
        body: JSON.stringify(rsvpData),
      });

      if (!response.ok) throw new Error('Failed to update RSVP');

      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

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
      // 🔍 Fetch RSVPs for Event
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

      // 🔐 Create RSVP (CSRF Protected)
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

      // 🔐 Update RSVP (CSRF Protected)
      .addCase(updateRSVP.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateRSVP.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.rsvps.findIndex(
          (rsvp) => rsvp.id === action.payload.id,
        );
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
