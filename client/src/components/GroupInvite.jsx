import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../redux/userSlice';
import { sendGroupInvite } from '../redux/groupSlice'; // Import the sendGroupInvite action
import { useParams } from 'react-router-dom';

function GroupInvite() {
  console.log('Rendering GroupInvite Component');
  const { id } = useParams(); // Group ID
  const dispatch = useDispatch();

  const users = useSelector((state) => state.users.users || []); // Ensure fallback to an empty array
  const inviteStatus = useSelector((state) => state.groups.inviteStatus);
  const inviteError = useSelector((state) => state.groups.inviteError);

  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    dispatch(fetchUsers()); // Ensure this is called to populate users
  }, [dispatch]);

  const handleInvite = (e) => {
    e.preventDefault();
    console.log("Inviting user ID:", selectedUserId);
    dispatch(sendGroupInvite({ groupId: id, invitedUserId: selectedUserId }));
  };

  return (
    <div>
      <h2>Invite Users to Group</h2>
      <form onSubmit={handleInvite}>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Select a user to invite</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <button type="submit">Send Invitation</button>
      </form>
      {inviteStatus === 'success' && <p>Invitation sent successfully!</p>}
      {inviteStatus === 'failed' && <p>Error: {inviteError}</p>}
    </div>
  );
}

export default GroupInvite;
