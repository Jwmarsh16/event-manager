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


// Thunk to fetch all events
export const fetchEvents = createAsyncThunk('events/fetchEvents', async (_, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/events');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch events');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch events');
  }
});

// Thunk to search events by name
export const searchEvents = createAsyncThunk('events/searchEvents', async (query, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/events?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to search events');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching events:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to search events');
  }
});

// Thunk to fetch a specific event by ID
export const fetchEventById = createAsyncThunk('events/fetchEventById', async (id, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/events/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch event');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch event');
  }
});

// Thunk to create a new event
export const createEvent = createAsyncThunk('events/createEvent', async (eventData, thunkAPI) => {
  try {
    const response = await fetchWithCredentials('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create event');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to create event');
  }
});

// Thunk to update an event
export const updateEvent = createAsyncThunk('events/updateEvent', async ({ id, eventData }, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update event');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating event:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to update event');
  }
});

// Thunk to delete an event
export const deleteEvent = createAsyncThunk('events/deleteEvent', async (id, thunkAPI) => {
  try {
    const response = await fetchWithCredentials(`/api/events/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete event');
    }
    return { id }; // Return the event ID to remove it from the state
  } catch (error) {
    console.error('Error deleting event:', error);
    return thunkAPI.rejectWithValue(error.message || 'Failed to delete event');
  }
});

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    searchResults: [], // Store search results
    currentEvent: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetEventState: (state) => {
      state.loading = false;
      state.error = null;
    },
    resetSearchResults: (state) => {
      state.searchResults = []; // Reset search results
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch events';
      })

      .addCase(searchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload; // Replace current events with search results
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search events';
      })

      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch event';
      })

      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create event';
      })

      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update event';
      })

      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter(event => event.id !== action.payload.id);
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete event';
      });
  },
});

export const { resetEventState, resetSearchResults } = eventSlice.actions;
export default eventSlice.reducer;
