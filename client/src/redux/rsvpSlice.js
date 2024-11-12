import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function to handle fetch requests with credentials and CSRF token
const fetchWithCredentials = (url, options = {}) => {
  const csrfToken = Cookies.get('csrf_access_token');
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
    const data = await response.json();
    return data;
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
    const data = await response.json();
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to submit RSVP');
  }
});

const rsvpSlice = createSlice({
  name: 'rsvps',
  initialState: {
    rsvps: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetRsvpState: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(createRSVP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRSVP.fulfilled, (state, action) => {
        state.loading = false;
        state.rsvps.push(action.payload);
      })
      .addCase(createRSVP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to submit RSVP';
      });
  },
});

export const { resetRsvpState } = rsvpSlice.actions;
export default rsvpSlice.reducer;
