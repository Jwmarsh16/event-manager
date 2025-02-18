import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

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

  return response;
};

// Thunk to fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, thunkAPI) => {
    try {
      const response = await fetchWithCredentials('/api/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to fetch users');
    }
  },
);

// Thunk to search users by name
export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(
        `/api/users?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search users');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || 'Failed to search users',
      );
    }
  },
);

// Thunk to fetch the current user's profile
export const fetchUserProfileById = createAsyncThunk(
  'users/fetchUserProfileById',
  async (id, thunkAPI) => {
    try {
      const response = await fetchWithCredentials(`/api/profile/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user profile');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || 'Failed to fetch user profile',
      );
    }
  },
);

// Basic selector to get users from the state
const selectUsers = (state) => state.users.users;

// Memoized selector to get only active users
export const selectFilteredUsers = createSelector([selectUsers], (users) =>
  users.filter((user) => user.active),
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    searchResults: [],
    profile: null, // State property for the user profile
    loading: false,
    error: null,
  },
  reducers: {
    resetUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.profile = null; // Reset profile on logout or other state reset
    },
    resetSearchResults: (state) => {
      state.searchResults = []; // Reset search results
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch users';
      })

      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload; // Replace current users with search results
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search users';
      })

      // Handle fetchUserProfileById
      .addCase(fetchUserProfileById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfileById.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfileById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user profile';
      });
  },
});

export const { resetUserState, resetSearchResults } = userSlice.actions;
export default userSlice.reducer;
