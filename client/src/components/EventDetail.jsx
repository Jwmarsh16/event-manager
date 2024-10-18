import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, deleteEvent } from '../redux/eventSlice';
import RSVPs from './RSVPs';

function EventDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // useNavigate replaces useHistory in react-router-dom v6

  const event = useSelector((state) => state.events.currentEvent);
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);
  const currentUserId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    dispatch(fetchEventById(id));
  }, [dispatch, id]);

  const handleDeleteEvent = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      dispatch(deleteEvent(id)).then(() => {
        navigate(`/profile/${currentUserId}`); // Redirect to events list after deletion
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {event && (
        <>
          <h2>{event.name}</h2>
          <p>Date: {event.date}</p>
          <p>Location: {event.location}</p>
          <p>Description: {event.description}</p>
          <button onClick={handleDeleteEvent}>Delete Event</button> {/* Button to delete the event */}
          <RSVPs eventId={event.id} /> {/* Include the RSVP form here */}
          
          <h3>RSVPs:</h3>
          <ul>
            {event.rsvps && event.rsvps.map(rsvp => (
              <li key={rsvp.user_id}>
                {rsvp.username} - {rsvp.status}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default EventDetail;
