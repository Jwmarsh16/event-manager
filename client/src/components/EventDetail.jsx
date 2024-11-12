import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, deleteEvent } from '../redux/eventSlice';
import RSVPs from './RSVPs';
import '../style/EventDetailStyle.css';

function EventDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
        navigate(`/profile/${currentUserId}`);
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="event-detail">
      {event && (
        <>
          <div className="event-info">
            <h2>{event.name}</h2>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p>{event.description}</p>
            {/* Only show delete button if the current user is the creator of the event */}
            {currentUserId === event.user_id && (
              <button className="delete-button" onClick={handleDeleteEvent}>
                Delete Event
              </button>
            )}
          </div>

          <div className="rsvp-section">
            <RSVPs eventId={event.id} />
          </div>

          <div className="rsvp-list">
            <h3>RSVPs</h3>
            <ul>
              {event.rsvps && event.rsvps.map(rsvp => (
                <li key={rsvp.user_id}>
                  <span className="rsvp-username">{rsvp.username}</span> - 
                  <span className={`rsvp-status ${rsvp.status.toLowerCase()}`}>
                    {rsvp.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default EventDetail;
