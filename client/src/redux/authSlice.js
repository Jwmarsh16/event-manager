import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function to retrieve the JWT CSRF token from its cookie
const fetchCSRFToken = async () => {
  // JWT's built-in CSRF cookie is now named 'jwt_csrf_access'
  return Cookies.get('jwt_csrf_access');
};

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = async (url, options = {}) => {
  const isModifyingRequest = ['POST', 'PUT', 'DELETE'].includes(options.method);

  let csrfToken = '';

  // For modifying requests, get the JWT CSRF token from the cookie
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

// 🔍 Check Authentication Status
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, thunkAPI) => {
    try {
      const response = await fetch('/api/profile', { credentials: 'include' });

      if (!response.ok) throw new Error('User not authenticated');

      return await response.json(); // Return user data if authenticated
    } catch (error) {
      console.error('Authentication check failed:', error.message);
      thunkAPI.dispatch(logout()); // Log the user out if JWT is expired
      return thunkAPI.rejectWithValue(null);
    }
  },
);

// 🔐 Register User (CSRF Protected)
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, thunkAPI) => {
    try {
      const response = await fetchWithCredentials('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to register');

      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Login User (CSRF Protected)
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await fetchWithCredentials('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Failed to login');

      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Logout User (CSRF Protected)
export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/logout', {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to logout');

    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

// 🔐 Delete Profile (CSRF Protected)
export const deleteProfile = createAsyncThunk(
  'auth/deleteProfile',
  async (_, thunkAPI) => {
    try {
      const response = await fetchWithCredentials('/api/profile/delete', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete profile');

      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Auth Slice
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
      // 🔍 Check Authentication Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })

      // 🔐 Register User (CSRF Protected)
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

      // 🔐 Delete Profile (CSRF Protected)
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

      // 🔐 Login User (CSRF Protected)
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to login';
      })

      // 🔐 Logout User (CSRF Protected)
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setUser, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
