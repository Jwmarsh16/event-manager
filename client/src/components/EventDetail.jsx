import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, deleteEvent } from '../redux/eventSlice'; // Fetch the event
import { fetchUsers } from '../redux/userSlice'; // Fetch users
import { inviteUserToEvent } from '../redux/inviteSlice'; // Invite users
import { createRSVP } from '../redux/rsvpSlice'; // RSVP actions
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style/EventDetailStyle.css';

function EventDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(''); // Search query for user search
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered user list
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState(null); // Feedback for RSVP actions
  const [deleting, setDeleting] = useState(false); // State for deletion

  const event = useSelector((state) => state.events.currentEvent);
  const users = useSelector((state) => state.users.users || []); // Ensure users is a default empty array
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);
  const currentUserId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    dispatch(fetchEventById(id)); // Fetch event details
    dispatch(fetchUsers()); // Fetch all users
  }, [dispatch, id]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter((user) => user.username?.toLowerCase().includes(query)) // Safeguard against undefined username
      );
    }
  }, [searchQuery, users]);

  const handleRSVP = async (status) => {
    try {
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
          {/* Event Information */}
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
            {event.rsvps && event.rsvps.length > 0 ? (
              <ul>
                {event.rsvps.map((rsvp) => (
                  <li key={rsvp.user_id}>
                    <span className="rsvp-username">{rsvp.username}</span>
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
