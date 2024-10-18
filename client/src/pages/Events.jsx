import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEvents, createEvent } from '../redux/eventSlice';

function Events() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // useNavigate hook to programmatically navigate
  const events = useSelector((state) => state.events.events);
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);

  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');  // Changed to datetime
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
      // Re-fetch events to ensure the new event is displayed
      dispatch(fetchEvents());
      // Optionally, navigate to the event page
      navigate(`/events`);
    }

    setName(''); // Clear the form fields after submission
    setDateTime('');
    setLocation('');
    setDescription('');
  };

  return (
    <div>
      <h2>Events</h2>
      <form onSubmit={handleCreateEvent}>
        <input
          type="text"
          placeholder="Name"
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
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Create Event</button>
      </form>
      {loading && <p>Loading events...</p>}
      {error && <p>Error: {error}</p>}
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <Link to={`/events/${event.id}`}>{event.name} - {event.date}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Events;
