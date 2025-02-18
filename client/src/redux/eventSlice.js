import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

// Helper function to fetch CSRF token before modifying requests
const fetchCSRFToken = async () => {
  await fetch('/csrf-token', { credentials: 'include' });
};

// Helper function for fetch requests with credentials and CSRF token
const fetchWithCredentials = async (url, options = {}) => {
  if (['POST', 'PUT', 'DELETE'].includes(options.method)) {
    await fetchCSRFToken(); // Ensure CSRF token is refreshed before modifying requests
  }

  const csrfToken = Cookies.get('csrf_access_token') || ''; // Retrieve the latest CSRF token
  console.log('CSRF Token Sent:', csrfToken); // Debugging: Log the token being sent

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

// 🔍 Fetch all events
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (_, thunkAPI) => {
    try {
      console.log('Fetching all events...');
      const response = await fetchWithCredentials('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return await response.json();
    } catch (error) {
      console.error('Fetch events failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔍 Search events by name
export const searchEvents = createAsyncThunk(
  'events/searchEvents',
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

// 🔍 Fetch a specific event by ID
export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (id, thunkAPI) => {
    try {
      console.log(`Fetching event by ID: ${id}`);
      const response = await fetchWithCredentials(`/api/events/${id}`);
      if (!response.ok) throw new Error('Failed to fetch event');

      const data = await response.json();
      const currentUserId = thunkAPI.getState().auth.user?.id;
      const isUserInvited = data.rsvps.some(
        (rsvp) => rsvp.user_id === currentUserId,
      );

      return { ...data, isUserInvited };
    } catch (error) {
      console.error(`Fetch event by ID ${id} failed:`, error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Create a new event (CSRF Protected)
export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData, thunkAPI) => {
    try {
      console.log('Creating event:', eventData);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Failed to create event');

      const createdEvent = await response.json();
      const eventResponse = await fetchWithCredentials(
        `/api/events/${createdEvent.event.id}`,
      );

      if (!eventResponse.ok)
        throw new Error('Failed to fetch full event details');
      return await eventResponse.json();
    } catch (error) {
      console.error('Create event failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Update an event (CSRF Protected)
export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, eventData }, thunkAPI) => {
    try {
      console.log(`Updating event with ID: ${id}`);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error('Failed to update event');

      return await response.json();
    } catch (error) {
      console.error(`Update event with ID ${id} failed:`, error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Delete an Event (CSRF Protected)
export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id, thunkAPI) => {
    try {
      console.log(`Deleting event with ID: ${id}`);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      return { id }; // Return the event ID to remove it from the state
    } catch (error) {
      console.error(`Delete event with ID ${id} failed:`, error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 RSVP to an Event (CSRF Protected)
export const rsvpToEvent = createAsyncThunk(
  'events/rsvpToEvent',
  async ({ eventId, status }, thunkAPI) => {
    try {
      console.log(`RSVPing to event with ID: ${eventId} and status: ${status}`);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials('/api/rsvps', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId, status }),
      });

      if (!response.ok) throw new Error('Failed to RSVP');

      return await response.json();
    } catch (error) {
      console.error('RSVP failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔍 Fetch Event Invitations (No CSRF Required, Read-Only)
export const fetchEventInvitations = createAsyncThunk(
  'events/fetchEventInvitations',
  async (_, thunkAPI) => {
    try {
      console.log('Fetching event invitations...');
      const response = await fetchWithCredentials('/api/event_invitations');
      if (!response.ok) throw new Error('Failed to fetch event invitations');
      return await response.json();
    } catch (error) {
      console.error('Fetch event invitations failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Accept an Event Invitation (CSRF Protected)
export const acceptEventInvite = createAsyncThunk(
  'events/acceptEventInvite',
  async (invitationId, thunkAPI) => {
    try {
      console.log(`Accepting event invitation with ID: ${invitationId}`);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials(
        `/api/event_invitations/${invitationId}/accept`,
        {
          method: 'PUT',
        },
      );

      if (!response.ok) throw new Error('Failed to accept event invitation');

      return { id: invitationId }; // Return the invitation ID to remove it from the store
    } catch (error) {
      console.error('Accept event invitation failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

// 🔐 Deny an Event Invitation (CSRF Protected)
export const denyEventInvite = createAsyncThunk(
  'events/denyEventInvite',
  async (invitationId, thunkAPI) => {
    try {
      console.log(`Denying event invitation with ID: ${invitationId}`);
      await fetchCSRFToken(); // Ensure CSRF token is refreshed

      const response = await fetchWithCredentials(
        `/api/event_invitations/${invitationId}/deny`,
        {
          method: 'PUT',
        },
      );

      if (!response.ok) throw new Error('Failed to deny event invitation');

      return { id: invitationId }; // Return the invitation ID to remove it from the store
    } catch (error) {
      console.error('Deny event invitation failed:', error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

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
        const index = state.events.findIndex(
          (event) => event.id === action.payload.id,
        );
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
        state.events = state.events.filter(
          (event) => event.id !== action.payload.id,
        );
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
        state.invitations = state.invitations.filter(
          (invite) => invite.id !== action.payload.id,
        ); // Remove accepted invite
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
        state.invitations = state.invitations.filter(
          (invite) => invite.id !== action.payload.id,
        ); // Remove denied invite
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
