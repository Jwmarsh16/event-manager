import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../redux/userSlice';
import { sendGroupInvite } from '../redux/groupSlice';
import { useParams } from 'react-router-dom';
import '../style/GroupInviteStyle.css';

function GroupInvite() {
  const { id } = useParams(); // Group ID
  const dispatch = useDispatch();

  const users = useSelector((state) => state.users.users || []);
  const inviteStatus = useSelector((state) => state.groups.inviteStatus);
  const inviteError = useSelector((state) => state.groups.inviteError);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter((user) =>
        user.username.toLowerCase().includes(lowerCaseQuery)
      )
    );
  }, [searchQuery, users]);

  const handleInvite = (userId) => {
    dispatch(sendGroupInvite({ groupId: id, invitedUserId: userId }))
      .unwrap()
      .then(() => {
        setFeedbackMessage('Invitation sent successfully!');
        setSearchQuery('');
      })
      .catch((error) => {
        setFeedbackMessage(`Error: ${error.message}`);
      });
  };

  return (
    <div className="group-invite-container">
      <h2 className="invite-title">Invite Users to Group</h2>
      <input
        className="search-input"
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="user-results">
        {filteredUsers.map((user) => (
          <div key={user.id} className="user-item">
            <span>{user.username}</span>
            <button
              className="invite-user-button"
              onClick={() => handleInvite(user.id)}
            >
              Invite
            </button>
          </div>
        ))}
        {filteredUsers.length === 0 && searchQuery && (
          <p className="no-results">No users found.</p>
        )}
      </div>
      {feedbackMessage && <p className="feedback-message">{feedbackMessage}</p>}
    </div>
  );
}

export default GroupInvite;
