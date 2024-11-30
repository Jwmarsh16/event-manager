import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchEvents, createEvent } from '../redux/eventSlice';
import '../style/EventsStyle.css';

function Events() {
  const dispatch = useDispatch();
  const events = useSelector((state) => state.events.events || []); // Ensure events fallback to an empty array
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);
  const operation = useSelector((state) => state.events.operation); // To track operations like 'creating'

  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const [filteredEvents, setFilteredEvents] = useState(events);

  // Ref to ensure fetchEvents runs only once after mounting
  const hasFetchedEvents = useRef(false);

  useEffect(() => {
    if (!hasFetchedEvents.current) {
      console.log('Dispatching fetchEvents...');
      dispatch(fetchEvents());
      hasFetchedEvents.current = true; // Prevents repeated fetches
    }
  }, [dispatch]);

  // Update filtered events whenever `events` or `searchQuery` changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredEvents(
        events.filter((event) =>
          event?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredEvents(events); // Show all events if no search query
    }
  }, [events, searchQuery]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError('');

    console.log('Creating event with:', { name, dateTime, location, description });

    if (!name || !dateTime || !location || !description) {
      setFormError('All fields are required to create an event.');
      return;
    }

    const newEvent = { name, date: dateTime, location, description };
    const result = await dispatch(createEvent(newEvent));

    if (result.meta.requestStatus === 'fulfilled') {
      console.log('Event created successfully. Clearing form...');
      setName('');
      setDateTime('');
      setLocation('');
      setDescription('');
      setFormError('');
    } else {
      setFormError('Failed to create event. Please try again.');
    }
  };


  return (
    <div className="events-page">
      {/* Hero Section */}
      <div className="events-hero">
        <h1>Discover and Manage Events</h1>
        <p>Find exciting events, create new ones, and manage your schedule effortlessly!</p>
      </div>

      {/* Event Form */}
      <form className="event-form" onSubmit={handleCreateEvent}>
        <h2>Create a New Event</h2>
        {formError && <p className="form-error">{formError}</p>}
        <input
          type="text"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" disabled={operation === 'creating'}>
          {operation === 'creating' ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Event List */}
      {loading && <p>Loading events...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      <div className="events-list">
        {filteredEvents.map((event) => (
          <div key={event.id} className="event-card">
            <h3>
              <Link to={`/events/${event.id}`}>{event.name}</Link>
            </h3>
            <p>
              <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Location:</strong> {event.location}
            </p>
            <p>{event.description}</p>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <p className="no-results">No events match your search query.</p>
        )}
      </div>
    </div>
  );
}

export default Events;
