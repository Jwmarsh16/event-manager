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

// 🔍 Fetch Comments (No CSRF Required, Read-Only)
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (_, thunkAPI) => {
    try {
      const response = await fetchWithCredentials('/api/comments');
      if (!response.ok) throw new Error('Failed to fetch comments');
      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Add a Comment (CSRF Protected)
export const addComment = createAsyncThunk(
  'comments/addComment',
  async (commentData, thunkAPI) => {
    try {
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials('/api/comments', {
        method: 'POST',
        body: JSON.stringify(commentData),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      return await response.json();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Delete a Comment (CSRF Protected)
export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId, thunkAPI) => {
    try {
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials(
        `/api/comments/${commentId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Failed to delete comment');

      return { id: commentId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// Comment Slice
const commentSlice = createSlice({
  name: 'comments',
  initialState: {
    comments: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🔍 Fetch Comments (No CSRF Required, Read-Only)
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔐 Add Comment (CSRF Protected)
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        state.comments.push(action.payload);
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add comment';
      })

      // 🔐 Delete Comment (CSRF Protected)
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = state.comments.filter(
          (comment) => comment.id !== action.payload.id,
        );
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete comment';
      });
  },
});

export default commentSlice.reducer;
