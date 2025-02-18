import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

// Helper function to handle fetch requests with credentials
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
