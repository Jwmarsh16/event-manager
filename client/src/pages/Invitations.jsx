import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchGroupInvitations,
  acceptGroupInvite,
  denyGroupInvite,
} from '../redux/groupSlice';
import {
  fetchEventInvitations,
  acceptEventInvite,
  denyEventInvite,
} from '../redux/eventSlice';
import { Link } from 'react-router-dom';
import '../style/InvitationsStyle.css';

function Invitations() {
  const dispatch = useDispatch();

  // Group Invitations
  const groupInvitations = useSelector((state) => state.groups.invitations || []);
  const groupLoading = useSelector((state) => state.groups.loading);
  const groupError = useSelector((state) => state.groups.error);

  // Event Invitations
  const eventInvitations = useSelector((state) => state.events.invitations || []);
  const eventLoading = useSelector((state) => state.events.loading);
  const eventError = useSelector((state) => state.events.error);

  // Fetch invitations on mount
  useEffect(() => {
    dispatch(fetchGroupInvitations());
    dispatch(fetchEventInvitations());
  }, [dispatch]);

  // Handlers for Group Invitations
  const handleAcceptGroupInvite = (inviteId) => {
    dispatch(acceptGroupInvite(inviteId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        alert('Group invitation accepted successfully.');
      } else {
        alert('Failed to accept group invitation. Please try again.');
      }
    });
  };

  const handleDenyGroupInvite = (inviteId) => {
    dispatch(denyGroupInvite(inviteId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        alert('Group invitation denied successfully.');
      } else {
        alert('Failed to deny group invitation. Please try again.');
      }
    });
  };

  // Handlers for Event Invitations
  const handleAcceptEventInvite = (inviteId) => {
    dispatch(acceptEventInvite(inviteId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        alert('Event invitation accepted successfully.');
      } else {
        alert('Failed to accept event invitation. Please try again.');
      }
    });
  };

  const handleDenyEventInvite = (inviteId) => {
    dispatch(denyEventInvite(inviteId)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        alert('Event invitation denied successfully.');
      } else {
        alert('Failed to deny event invitation. Please try again.');
      }
    });
  };

  return (
    <div className="invitations-page">
      <h2 className="page-title">Invitations</h2>

      {/* Group Invitations Section */}
      <section className="invitation-section">
        <h3 className="section-title">Group Invitations</h3>
        {groupLoading && <p className="loading-message">Loading group invitations...</p>}
        {groupError && <p className="error-message">Error: {groupError}</p>}
        {groupInvitations.length > 0 ? (
          <ul className="invitation-list">
            {groupInvitations.map((invite) => (
              <li key={invite.id} className="invitation-item">
                <div className="invitation-details">
                  <p className="invitation-group">
                    <span className="invitation-label">Group:</span>{' '}
                    <Link to={`/groups/${invite.group?.id}`} className="group-link">
                      {invite.group?.name || 'Unknown Group'}
                    </Link>
                  </p>
                  <div className="invitation-inviter">
                    <img
                      src={`https://i.pravatar.cc/50?u=${invite.inviter?.id}`}
                      alt={`${invite.inviter?.username}'s Avatar`}
                      className="inviter-avatar"
                    />
                    <Link to={`/profile/${invite.inviter?.id}`} className="inviter-link">
                      {invite.inviter?.username || 'Unknown User'}
                    </Link>
                  </div>
                </div>
                <div className="invitation-actions">
                  <button
                    className="invitation-button accept-button"
                    onClick={() => handleAcceptGroupInvite(invite.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="invitation-button deny-button"
                    onClick={() => handleDenyGroupInvite(invite.id)}
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-invitations-message">No group invitations found.</p>
        )}
      </section>

      {/* Event Invitations Section */}
      <section className="invitation-section">
        <h3 className="section-title">Event Invitations</h3>
        {eventLoading && <p className="loading-message">Loading event invitations...</p>}
        {eventError && <p className="error-message">Error: {eventError}</p>}
        {eventInvitations.length > 0 ? (
          <ul className="invitation-list">
            {eventInvitations.map((invite) => (
              <li key={invite.id} className="invitation-item">
                <div className="invitation-details">
                  <p className="invitation-event">
                    <span className="invitation-label">Event:</span>{' '}
                    <Link to={`/events/${invite.event?.id}`} className="event-link">
                      {invite.event?.name || 'Unknown Event'}
                    </Link>
                  </p>
                  <div className="invitation-inviter">
                    <img
                      src={`https://i.pravatar.cc/50?u=${invite.inviter?.id}`}
                      alt={`${invite.inviter?.username}'s Avatar`}
                      className="inviter-avatar"
                    />
                    <Link to={`/profile/${invite.inviter?.id}`} className="inviter-link">
                      {invite.inviter?.username || 'Unknown User'}
                    </Link>
                  </div>
                </div>
                <div className="invitation-actions">
                  <button
                    className="invitation-button accept-button"
                    onClick={() => handleAcceptEventInvite(invite.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="invitation-button deny-button"
                    onClick={() => handleDenyEventInvite(invite.id)}
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-invitations-message">No event invitations found.</p>
        )}
      </section>
    </div>
  );
}

export default Invitations;
