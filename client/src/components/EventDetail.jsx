import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchEventById, deleteEvent } from '../redux/eventSlice'; // Fetch the event
import { createRSVP } from '../redux/rsvpSlice'; // RSVP actions
import { fetchUsers } from '../redux/userSlice'; // Fetch users
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style/EventDetailStyle.css';

function EventDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [rsvpMessage, setRsvpMessage] = useState(null); // Feedback for RSVP actions
  const [deleting, setDeleting] = useState(false); // State for deletion
  const [localRSVPs, setLocalRSVPs] = useState([]); // Local state for RSVP list

  const event = useSelector((state) => state.events.currentEvent);
  const users = useSelector((state) => state.users.users || []); // Ensure users is a default empty array
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);
  const currentUserId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    // Fetch users if not already loaded
    if (users.length === 0) {
      dispatch(fetchUsers());
    }

    // Fetch event details
    dispatch(fetchEventById(id)).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        enrichRSVPs(action.payload.rsvps);
      }
    });
  }, [dispatch, id, users]);

  const enrichRSVPs = (rsvps) => {
    // Enrich RSVP list with usernames and avatars
    const enrichedRSVPs = rsvps.map((rsvp) => {
      const user = users.find((user) => user.id === rsvp.user_id);
      return {
        ...rsvp,
        username: user?.username || 'Unknown',
        avatar: user ? `https://i.pravatar.cc/50?u=${user.id}` : null,
      };
    });
    setLocalRSVPs(enrichedRSVPs);
  };

  const handleRSVP = async (status) => {
    try {
      const result = await dispatch(createRSVP({ event_id: id, status }));
      if (result.meta.requestStatus === 'fulfilled') {
        setRsvpMessage(`RSVP ${status} successfully!`);
        // Update local RSVP list
        const updatedRSVP = {
          user_id: currentUserId,
          username: users.find((user) => user.id === currentUserId)?.username || 'You',
          avatar: `https://i.pravatar.cc/50?u=${currentUserId}`,
          status,
        };
        setLocalRSVPs((prevRSVPs) => {
          const existingRSVPIndex = prevRSVPs.findIndex((rsvp) => rsvp.user_id === currentUserId);
          if (existingRSVPIndex !== -1) {
            const updatedRSVPs = [...prevRSVPs];
            updatedRSVPs[existingRSVPIndex] = updatedRSVP;
            return updatedRSVPs;
          } else {
            return [...prevRSVPs, updatedRSVP];
          }
        });
      } else {
        setRsvpMessage('Must accept event invite to submit RSVP. Please try again.');
      }
    } catch (error) {
      setRsvpMessage(error.message || 'Failed to submit RSVP.');
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setDeleting(true);
      try {
        const result = await dispatch(deleteEvent(id));
        if (result.meta.requestStatus === 'fulfilled') {
          toast.success('Event deleted successfully!');
          navigate(`/profile/${currentUserId}`);
        } else {
          toast.error('Failed to delete event. You might not have permission.');
        }
      } catch (error) {
        toast.error(error.message || 'An error occurred while deleting the event.');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="event-detail">
      {event && (
        <>
          {/* Event Information */}
          <div className="event-info">
            <h2>{event.name}</h2>
            <p>
              <strong>Host:</strong> {event.user.username}
            </p>
            <p>
              <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Location:</strong> {event.location}
            </p>
            <p>{event.description}</p>
          </div>

          {/* RSVP Section */}
          <div className="rsvp-actions">
            <h3>Your RSVP</h3>
            {rsvpMessage && <p className="rsvp-feedback">{rsvpMessage}</p>}
            <button
              className="rsvp-button confirm"
              onClick={() => handleRSVP('Confirmed')}
            >
              Confirm
            </button>
            <button
              className="rsvp-button decline"
              onClick={() => handleRSVP('Declined')}
            >
              Decline
            </button>
          </div>

          {/* RSVP List */}
          <div className="rsvp-list">
            <h3>RSVPs</h3>
            {localRSVPs.length > 0 ? (
              <ul>
                {localRSVPs.map((rsvp) => (
                  <li key={rsvp.user_id} className="rsvp-item">
                    <Link to={`/profile/${rsvp.user_id}`} className="rsvp-avatar-link">
                      {rsvp.avatar && (
                        <img
                          src={rsvp.avatar}
                          alt={`${rsvp.username}'s Avatar`}
                          className="rsvp-avatar"
                        />
                      )}
                    </Link>
                    <Link to={`/profile/${rsvp.user_id}`} className="rsvp-username-link">
                      <span className="rsvp-username">{rsvp.username}</span>
                    </Link>
                    <span className={`rsvp-status ${rsvp.status.toLowerCase()}`}>
                      {rsvp.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No RSVPs yet.</p>
            )}
          </div>

          {/* Invite User Section */}
          {currentUserId === event.user_id && (
            <div className="invite-section">
              <Link to={`/events/${id}/invite`} className="invite-link">
                Invite Users
              </Link>
            </div>
          )}

          {/* Delete Button */}
          {currentUserId === event.user_id && (
            <button
              className="delete-button"
              onClick={handleDeleteEvent}
              title="Delete Event"
              disabled={deleting} // Disable the button while deleting
            >
              {deleting ? 'Deleting...' : 'Delete Event'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default EventDetail;
