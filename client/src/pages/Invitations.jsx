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
  const groupInvitations = useSelector((state) => state.groups.invitations);
  const groupLoading = useSelector((state) => state.groups.loading);
  const groupError = useSelector((state) => state.groups.error);

  // Event Invitations
  const eventInvitations = useSelector((state) => state.events.invitations);
  const eventLoading = useSelector((state) => state.events.loading);
  const eventError = useSelector((state) => state.events.error);

  // Fetch both Group and Event invitations on component mount
  useEffect(() => {
    dispatch(fetchGroupInvitations());
    dispatch(fetchEventInvitations());
  }, [dispatch]);

  // Handlers for Group Invitations
  const handleAcceptGroupInvite = (inviteId) => {
    dispatch(acceptGroupInvite(inviteId));
  };

  const handleDenyGroupInvite = (inviteId) => {
    dispatch(denyGroupInvite(inviteId));
  };

  // Handlers for Event Invitations
  const handleAcceptEventInvite = (inviteId) => {
    dispatch(acceptEventInvite(inviteId));
  };

  const handleDenyEventInvite = (inviteId) => {
    dispatch(denyEventInvite(inviteId));
  };

  return (
    <div>
      <h2>Invitations</h2>

      {/* Group Invitations Section */}
      <section>
        <h3>Group Invitations</h3>
        {groupLoading && <p>Loading group invitations...</p>}
        {groupError && <p>Error: {groupError}</p>}
        <ul>
          {groupInvitations.map((invite) => (
            <li key={invite.id}>
              <p>Group: {invite.group?.name || 'Unknown Group'}</p>
              <p>Invited by: {invite.inviter?.username || 'Unknown User'}</p>
              <button onClick={() => handleAcceptGroupInvite(invite.id)}>
                Accept
              </button>
              <button onClick={() => handleDenyGroupInvite(invite.id)}>
                Deny
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Event Invitations Section */}
      <section>
        <h3>Event Invitations</h3>
        {eventLoading && <p>Loading event invitations...</p>}
        {eventError && <p>Error: {eventError}</p>}
        <ul>
          {eventInvitations.map((invite) => (
            <li key={invite.id}>
              <p>Event: {invite.event?.name || 'Unknown Event'}</p>
              <p>Invited by: {invite.inviter?.username || 'Unknown User'}</p>
              <button onClick={() => handleAcceptEventInvite(invite.id)}>
                Accept
              </button>
              <button onClick={() => handleDenyEventInvite(invite.id)}>
                Deny
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Invitations;
