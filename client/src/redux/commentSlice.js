import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunk to fetch comments
export const fetchComments = createAsyncThunk('comments/fetchComments', async () => {
  const response = await fetch('/api/comments');
  const data = await response.json();
  return data;
});

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
      });
  },
});

export default commentSlice.reducer;
