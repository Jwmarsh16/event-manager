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
    <div>
      <h2>Invitations</h2>

      {/* Group Invitations Section */}
      <section>
        <h3>Group Invitations</h3>
        {groupLoading && <p>Loading group invitations...</p>}
        {groupError && <p>Error: {groupError}</p>}
        {groupInvitations.length > 0 ? (
          <ul>
            {groupInvitations.map((invite) => (
              <li key={invite.id}>
                <p>Group: {invite.group?.name || 'Unknown Group'}</p>
                <p>Invited by: {invite.inviter?.username || 'Unknown User'}</p>
                <button onClick={() => handleAcceptGroupInvite(invite.id)}>Accept</button>
                <button onClick={() => handleDenyGroupInvite(invite.id)}>Deny</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No group invitations found.</p>
        )}
      </section>

      {/* Event Invitations Section */}
      <section>
        <h3>Event Invitations</h3>
        {eventLoading && <p>Loading event invitations...</p>}
        {eventError && <p>Error: {eventError}</p>}
        {eventInvitations.length > 0 ? (
          <ul>
            {eventInvitations.map((invite) => (
              <li key={invite.id}>
                <p>Event: {invite.event?.name || 'Unknown Event'}</p>
                <p>Invited by: {invite.inviter?.username || 'Unknown User'}</p>
                <button onClick={() => handleAcceptEventInvite(invite.id)}>Accept</button>
                <button onClick={() => handleDenyEventInvite(invite.id)}>Deny</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No event invitations found.</p>
        )}
      </section>
    </div>
  );
}

export default Invitations;
