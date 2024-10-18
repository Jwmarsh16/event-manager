import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGroupInvitations, acceptGroupInvite, denyGroupInvite } from '../redux/groupSlice';

function GroupInvitations() {
  const dispatch = useDispatch();
  const invitations = useSelector((state) => state.groups.invitations);
  const loading = useSelector((state) => state.groups.loading);
  const error = useSelector((state) => state.groups.error);

  useEffect(() => {
    dispatch(fetchGroupInvitations());
  }, [dispatch]);

  const handleAcceptInvite = (inviteId) => {
    dispatch(acceptGroupInvite(inviteId));
  };

  const handleDenyInvite = (inviteId) => {
    dispatch(denyGroupInvite(inviteId));
  };

  return (
    <div>
      <h2>Group Invitations</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <ul>
        {invitations.map((invite) => (
          <li key={invite.id}>
            <p>Group: {invite.group?.name || 'Unknown Group'}</p>
            <p>Invited by: {invite.inviter?.username || 'Unknown User'}</p>
            <button onClick={() => handleAcceptInvite(invite.id)}>Accept</button>
            <button onClick={() => handleDenyInvite(invite.id)}>Deny</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GroupInvitations;
