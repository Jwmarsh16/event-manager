import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = (url, options = {}) => {
  const csrfToken = Cookies.get('csrf_access_token') || ''; // Gracefully handle missing CSRF tokens
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
    console.log('Fetching all events...');
    const response = await fetchWithCredentials('/api/events');
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching events:', errorData.message);
      throw new Error(errorData.message || 'Failed to fetch events');
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch events failed:', error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch events');
  }
});

// Thunk to search events by name
export const searchEvents = createAsyncThunk('events/searchEvents', async (query, thunkAPI) => {
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

// Thunk to fetch a specific event by ID
export const fetchEventById = createAsyncThunk('events/fetchEventById', async (id, thunkAPI) => {
  try {
    console.log(`Fetching event by ID: ${id}`);
    const response = await fetchWithCredentials(`/api/events/${id}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error fetching event by ID ${id}:`, errorData.message);
      throw new Error(errorData.message || 'Failed to fetch event');
    }
    const data = await response.json();

    const currentUserId = thunkAPI.getState().auth.user?.id;
    const isUserInvited = data.rsvps.some(rsvp => rsvp.user_id === currentUserId);

    return { ...data, isUserInvited };
  } catch (error) {
    console.error(`Fetch event by ID ${id} failed:`, error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch event');
  }
});

// Thunk to create a new event
export const createEvent = createAsyncThunk('events/createEvent', async (eventData, thunkAPI) => {
  try {
    console.log('Creating event:', eventData);
    const response = await fetchWithCredentials('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating event:', errorData.message);
      throw new Error(errorData.message || 'Failed to create event');
    }
    const createdEvent = await response.json();

    // Fetch the full event data using the newly created event's ID
    const eventResponse = await fetchWithCredentials(`/api/events/${createdEvent.event.id}`);
    if (!eventResponse.ok) {
      const errorData = await eventResponse.json();
      console.error('Error fetching full event details:', errorData.message);
      throw new Error(errorData.message || 'Failed to fetch full event details');
    }
    return await eventResponse.json(); // Return the fully populated event
  } catch (error) {
    console.error('Create event failed:', error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to create event');
  }
});


// Thunk to update an event
export const updateEvent = createAsyncThunk('events/updateEvent', async ({ id, eventData }, thunkAPI) => {
  try {
    console.log(`Updating event with ID: ${id}`);
    const response = await fetchWithCredentials(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error updating event with ID ${id}:`, errorData.message);
      throw new Error(errorData.message || 'Failed to update event');
    }
    return await response.json();
  } catch (error) {
    console.error(`Update event with ID ${id} failed:`, error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to update event');
  }
});

// Thunk to delete an event
export const deleteEvent = createAsyncThunk('events/deleteEvent', async (id, thunkAPI) => {
  try {
    console.log(`Deleting event with ID: ${id}`);
    const response = await fetchWithCredentials(`/api/events/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error deleting event with ID ${id}:`, errorData.message);
      throw new Error(errorData.message || 'Failed to delete event');
    }
    return { id }; // Return the event ID to remove it from the state
  } catch (error) {
    console.error(`Delete event with ID ${id} failed:`, error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to delete event');
  }
});

// Thunk to RSVP to an event
export const rsvpToEvent = createAsyncThunk('events/rsvpToEvent', async ({ eventId, status }, thunkAPI) => {
  try {
    console.log(`RSVPing to event with ID: ${eventId} and status: ${status}`);
    const response = await fetchWithCredentials('/api/rsvps', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, status }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error RSVPing to event:', errorData.message);
      throw new Error(errorData.message || 'Failed to RSVP');
    }
    return await response.json();
  } catch (error) {
    console.error('RSVP failed:', error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to RSVP');
  }
});

export const fetchEventInvitations = createAsyncThunk('events/fetchEventInvitations', async (_, thunkAPI) => {
  try {
    console.log('Fetching event invitations...');
    const response = await fetchWithCredentials('/api/event_invitations');
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching event invitations:', errorData.message);
      throw new Error(errorData.message || 'Failed to fetch event invitations');
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch event invitations failed:', error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to fetch event invitations');
  }
});

// Thunk to accept an event invitation
export const acceptEventInvite = createAsyncThunk('events/acceptEventInvite', async (invitationId, thunkAPI) => {
  try {
    console.log(`Accepting event invitation ID: ${invitationId}`);
    const response = await fetchWithCredentials(`/api/event_invitations/${invitationId}/accept`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error accepting event invitation ID ${invitationId}:`, errorData.message);
      throw new Error(errorData.message || 'Failed to accept event invitation');
    }
    return await response.json();
  } catch (error) {
    console.error(`Accept event invitation ID ${invitationId} failed:`, error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to accept event invitation');
  }
});

// Thunk to deny an event invitation
export const denyEventInvite = createAsyncThunk('events/denyEventInvite', async (invitationId, thunkAPI) => {
  try {
    console.log(`Denying event invitation ID: ${invitationId}`);
    const response = await fetchWithCredentials(`/api/event_invitations/${invitationId}/deny`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error denying event invitation ID ${invitationId}:`, errorData.message);
      throw new Error(errorData.message || 'Failed to deny event invitation');
    }
    return await response.json();
  } catch (error) {
    console.error(`Deny event invitation ID ${invitationId} failed:`, error.message);
    return thunkAPI.rejectWithValue(error.message || 'Failed to deny event invitation');
  }
});

// Event slice
const eventSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    searchResults: [],
    invitations: [], // Store event invitations
    currentEvent: null,
    loading: false,
    error: null,
    rsvpStatus: null,
    rsvpError: null,
    operation: null, // Tracks the type of operation (e.g., 'fetching', 'creating')
  },
  reducers: {
    resetEventState: (state) => {
      state.loading = false;
      state.error = null;
      state.rsvpStatus = null;
      state.rsvpError = null;
      state.operation = null;
    },
    resetSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.operation = 'fetching';
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
        state.operation = null;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch events';
        state.operation = null;
      })

      // Search Events
      .addCase(searchEvents.pending, (state) => {
        state.loading = true;
        state.operation = 'searching';
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
        state.operation = null;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search events';
        state.operation = null;
      })

      // Fetch Event By ID
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.operation = 'fetchingById';
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
        state.operation = null;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch event';
        state.operation = null;
      })

      // Create Event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.operation = 'creating';
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
        state.operation = null;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create event';
        state.operation = null;
      })

      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.operation = 'updating';
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        state.operation = null;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update event';
        state.operation = null;
      })

      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.operation = 'deleting';
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter(event => event.id !== action.payload.id);
        state.operation = null;
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete event';
        state.operation = null;
      })

      // RSVP to Event
      .addCase(rsvpToEvent.pending, (state) => {
        state.rsvpStatus = null;
        state.rsvpError = null;
        state.loading = true;
        state.operation = 'RSVPing';
      })
      .addCase(rsvpToEvent.fulfilled, (state) => {
        state.rsvpStatus = 'success';
        state.loading = false;
        state.operation = null;
      })
      .addCase(rsvpToEvent.rejected, (state, action) => {
        state.rsvpStatus = 'failed';
        state.rsvpError = action.payload || 'Failed to RSVP';
        state.loading = false;
        state.operation = null;
      })
      // Fetch Event Invitations
      .addCase(fetchEventInvitations.pending, (state) => {
        state.loading = true;
        state.operation = 'fetchingInvitations';
        state.error = null;
      })
      .addCase(fetchEventInvitations.fulfilled, (state, action) => {
        state.loading = false;
        state.invitations = action.payload; // Event invitations will be updated in state
        state.operation = null;
      })
      .addCase(fetchEventInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch event invitations';
        state.operation = null;
      })

      // Accept Event Invitation
      .addCase(acceptEventInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operation = 'acceptingInvite';
      })
      .addCase(acceptEventInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.invitations = state.invitations.filter((invite) => invite.id !== action.payload.id); // Remove accepted invite
        state.operation = null;
      })
      .addCase(acceptEventInvite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to accept event invitation';
        state.operation = null;
      })

      // Deny Event Invitation
      .addCase(denyEventInvite.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operation = 'denyingInvite';
      })
      .addCase(denyEventInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.invitations = state.invitations.filter((invite) => invite.id !== action.payload.id); // Remove denied invite
        state.operation = null;
      })
      .addCase(denyEventInvite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to deny event invitation';
        state.operation = null;
      });
  },
});

export const { resetEventState, resetSearchResults } = eventSlice.actions;
export default eventSlice.reducer;
