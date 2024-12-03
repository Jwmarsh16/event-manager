import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, deleteEvent } from '../redux/eventSlice';
import { fetchUsers } from '../redux/userSlice';
import { inviteUserToEvent } from '../redux/inviteSlice';
import { createRSVP } from '../redux/rsvpSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style/EventDetailStyle.css';

function EventDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const event = useSelector((state) => state.events.currentEvent);
  const users = useSelector((state) => state.users.users || []);
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);
  const currentUserId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    dispatch(fetchEventById(id));
    dispatch(fetchUsers());
  }, [dispatch, id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter((user) => user.username?.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, users]);

  const handleRSVP = async (status) => {
    try {
      const isInvited = event.rsvps?.some((rsvp) => rsvp.user_id === currentUserId);
      if (!isInvited) {
        setRsvpMessage('You must be invited to RSVP to this event.');
        return;
      }

      const result = await dispatch(createRSVP({ event_id: id, status }));
      if (result.meta.requestStatus === 'fulfilled') {
        setRsvpMessage(`RSVP ${status} successfully!`);
      } else {
        setRsvpMessage('Failed to submit RSVP. Please try again.');
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

  const handleInviteUser = async (userId) => {
    try {
      const result = await dispatch(inviteUserToEvent({ eventId: id, invitedUserId: userId }));
      if (result.meta.requestStatus === 'fulfilled') {
        alert('User invited successfully!');
      } else {
        alert('Failed to invite user. Please try again.');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert(error.message || 'Failed to invite user.');
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
          <div className="event-info">
            <h2>{event.name}</h2>
            <p>
              <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Location:</strong> {event.location}
            </p>
            <p>{event.description}</p>
          </div>

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

          <div className="rsvp-list">
            <h3>Accepted RSVPs</h3>
            {event.rsvps && event.rsvps.length > 0 ? (
              <ul>
                {event.rsvps
                  .filter((rsvp) => rsvp.status === 'Confirmed') // Only display accepted RSVPs
                  .map((rsvp) => (
                    <li key={rsvp.user_id}>
                      <span className="rsvp-username">{rsvp.username}</span>
                      <span className={`rsvp-status ${rsvp.status.toLowerCase()}`}>
                        ({rsvp.status})
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p>No confirmed RSVPs yet.</p>
            )}
          </div>

          {currentUserId === event.user_id && (
            <div className="invite-section">
              <button
                className="invite-button"
                onClick={() => setShowInviteInput((prev) => !prev)}
              >
                Invite Users
              </button>
              {showInviteInput && (
                <div className="invite-form">
                  <input
                    type="text"
                    placeholder="Search for users"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {filteredUsers.length > 0 ? (
                    <ul className="user-search-results">
                      {filteredUsers.map((user) => (
                        <li key={user.id} className="user-search-item">
                          <span>{user.username}</span>
                          <button
                            className="invite-user-button"
                            onClick={() => handleInviteUser(user.id)}
                          >
                            Invite
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No users found.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {currentUserId === event.user_id && (
            <button
              className="delete-button"
              onClick={handleDeleteEvent}
              title="Delete Event"
              disabled={deleting}
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
