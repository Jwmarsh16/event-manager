import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchUsers } from '../redux/userSlice';
import { inviteUserToEvent, cancelEventInvite, fetchInvitationsForEvent } from '../redux/inviteSlice';
import '../style/EventInviteStyle.css';

function EventInvite() {
  const { id } = useParams(); // Event ID
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState(new Map()); // Track invited users and their statuses

  const users = useSelector((state) => state.users.users || []);
  const loading = useSelector((state) => state.users.loading);
  const error = useSelector((state) => state.users.error);

  const invitations = useSelector((state) => state.invites.eventInvitations);

  useEffect(() => {
    // Fetch users and invitations when the component mounts
    dispatch(fetchUsers());
    dispatch(fetchInvitationsForEvent(id));
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

  useEffect(() => {
    const invitesMap = new Map();
    invitations.forEach((invite) => {
      invitesMap.set(invite.invitee.id, { id: invite.id, status: invite.status });
    });
    setInvitedUsers(invitesMap);
  }, [invitations]);

  const handleInviteToggle = async (userId) => {
    const invitation = invitedUsers.get(userId);

    if (invitation) {
      if (invitation.status === 'Pending') {
        const result = await dispatch(cancelEventInvite({ id: invitation.id }));
        if (result.meta.requestStatus === 'fulfilled') {
          setInvitedUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(userId);
            return updated;
          });
        } else {
          alert('Failed to cancel invite. Please try again.');
        }
      } else if (invitation.status === 'Denied') {
        const result = await dispatch(inviteUserToEvent({ eventId: id, invitedUserId: userId }));
        if (result.meta.requestStatus === 'fulfilled') {
          const newInvitation = result.payload;
          setInvitedUsers((prev) => {
            const updated = new Map(prev);
            updated.set(userId, { id: newInvitation.id, status: newInvitation.status });
            return updated;
          });
        } else {
          alert('Failed to send invite. Please try again.');
        }
      }
    } else {
      const result = await dispatch(inviteUserToEvent({ eventId: id, invitedUserId: userId }));
      if (result.meta.requestStatus === 'fulfilled') {
        const newInvitation = result.payload;
        setInvitedUsers((prev) => {
          const updated = new Map(prev);
          updated.set(userId, { id: newInvitation.id, status: newInvitation.status });
          return updated;
        });
      } else {
        alert('Failed to send invite. Please try again.');
      }
    }
  };

  const getButtonText = (userId) => {
    const invitation = invitedUsers.get(userId);
    if (!invitation) return 'Invite';
    if (invitation.status === 'Pending') return 'Cancel Invite';
    if (invitation.status === 'Accepted') return 'Invite Accepted';
    if (invitation.status === 'Denied') return 'Invite Again';
  };

  const isButtonDisabled = (userId) => {
    const invitation = invitedUsers.get(userId);
    return invitation && invitation.status === 'Accepted';
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="event-invite">
      <h2>Invite Users</h2>
      <input
        type="text"
        placeholder="Search for users"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      <ul className="user-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <li key={user.id} className="user-item">
              <div className="user-info">
                <img
                  className="user-avatar"
                  src={`https://i.pravatar.cc/50?u=${user.id}`}
                  alt={`${user.username}'s avatar`}
                />
                <span className="user-name">{user.username}</span>
              </div>
              <button
                className={`invite-button ${getButtonText(user.id).toLowerCase().replace(' ', '-')}`}
                onClick={() => handleInviteToggle(user.id)}
                disabled={isButtonDisabled(user.id)}
              >
                {getButtonText(user.id)}
              </button>
            </li>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </ul>
    </div>
  );
}

export default EventInvite;
