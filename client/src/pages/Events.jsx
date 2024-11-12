import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEvents, createEvent } from '../redux/eventSlice';
import '../style/EventsStyle.css';

function Events() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const events = useSelector((state) => state.events.events);
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);

  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!name || !dateTime || !location || !description) {
      alert("Please fill out all fields.");
      return;
    }

    const newEvent = { name, date: dateTime, location, description };
    const result = await dispatch(createEvent(newEvent));

    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(fetchEvents());
      navigate(`/events`);
    }

    setName('');
    setDateTime('');
    setLocation('');
    setDescription('');
  };

  return (
    <div className="events-page">
      <h2>Upcoming Events</h2>

      <form className="event-form" onSubmit={handleCreateEvent}>
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
        <button type="submit">Create Event</button>
      </form>

      {loading && <p>Loading events...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      <div className="events-list">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <h3><Link to={`/events/${event.id}`}>{event.name}</Link></h3>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p>{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Events;
