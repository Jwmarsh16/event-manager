import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper function to handle fetch requests
const fetchWithCredentials = (url, options) => fetch(url, {
  ...options,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
});

// Thunks for login and registration
export const registerUser = createAsyncThunk('auth/registerUser', async (userData, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to register');

    return { user: data.user };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to register');
  }
});

export const login = createAsyncThunk('auth/login', async ({ username, password }, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to login');

    return { id: data.user.id };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to login');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/logout', {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to logout');
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to logout');
  }
});

export const deleteProfile = createAsyncThunk('auth/deleteProfile', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/profile/delete', {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete profile');
    return await response.json();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to delete profile');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    resetAuthState: (state) => {
      state.loading = false;
      state.error = null;
    },
    setUser: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to register';
      })
      .addCase(deleteProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProfile.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(deleteProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete profile';
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = { id: action.payload.id };
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to login';
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to logout';
      });
  },
});

export const { setUser, resetAuthState } = authSlice.actions;

export default authSlice.reducer;
