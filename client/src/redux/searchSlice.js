import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function to fetch CSRF token from the backend endpoint
const fetchCSRFToken = async () => {
  const response = await fetch('/api/csrf-token', { credentials: 'include' });
  const data = await response.json();
  return data.csrf_token;
};

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = async (url, options = {}) => {
  const isModifyingRequest = ['POST', 'PUT', 'DELETE'].includes(options.method);

  let csrfToken = '';

  // Fetch CSRF token before modifying requests
  if (isModifyingRequest) {
    csrfToken = await fetchCSRFToken();
  }

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

  // Optionally, refresh the token after the request if needed
  if (isModifyingRequest) {
    await fetchCSRFToken();
  }

  return response;
};

// 🔍 Search Users (No CSRF Required, Read-Only)
export const searchUsers = createAsyncThunk(
  'search/searchUsers',
  async (query, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(
        `/api/users?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error('Failed to search users');
      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔍 Search Groups (No CSRF Required, Read-Only)
export const searchGroups = createAsyncThunk(
  'search/searchGroups',
  async (query, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(
        `/api/groups?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error('Failed to search groups');
      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔍 Search Events (No CSRF Required, Read-Only)
export const searchEvents = createAsyncThunk(
  'search/searchEvents',
  async (query, thunkAPI) => {
    try {
      console.log(`Searching events with query: "${query}"`);
      const response = await fetchWithCredentials(
        `/api/events?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error('Failed to search events');
      return await response.json();
    } catch (error) {
      console.error('Search events failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Search Slice
const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    users: [],
    groups: [],
    events: [],
    loading: false,
    error: null,
  },
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    resetSearchResults(state) {
      state.users = [];
      state.groups = [];
      state.events = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 🔍 Handle User Search
    builder
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search users';
      });

    // 🔍 Handle Group Search
    builder
      .addCase(searchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(searchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search groups';
      });

    // 🔍 Handle Event Search
    builder
      .addCase(searchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search events';
      });
  },
});

export const { setQuery, resetSearchResults } = searchSlice.actions;
export default searchSlice.reducer;
