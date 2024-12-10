import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

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

// Thunks for search
export const searchUsers = createAsyncThunk('search/searchUsers', async (query, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/users?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search users');
    }
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to search users');
  }
});

export const searchGroups = createAsyncThunk('search/searchGroups', async (query, thunkAPI) => {
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

export const searchEvents = createAsyncThunk('search/searchEvents', async (query, thunkAPI) => {
  try {
    console.log(`Searching events with query: "${query}"`);
    const response = await fetchWithCredentials(`/api/events?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error searching events:', errorData.message);
      throw new Error(errorData.message || 'Failed to search events');
    }
    return await response.json();
  } catch (error) {
    console.error('Search events failed:', error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to search events');
  }
});

// Search slice
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
    // Handle user search
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

    // Handle group search
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

    // Handle event search
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
