import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../redux/userSlice';
import {
  sendGroupInvite,
  fetchGroupInvitationsForGroup,
  deleteGroupInvite,
} from '../redux/groupSlice';
import { useParams } from 'react-router-dom';
import '../style/GroupInviteStyle.css';

function GroupInvite() {
  const { id } = useParams(); // Group ID
  const dispatch = useDispatch();

  const users = useSelector((state) => state.users.users || []);
  const groupInvitations = useSelector((state) => state.groups.invitations || []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [invitedUsers, setInvitedUsers] = useState(new Map()); // Track invitation statuses dynamically

  useEffect(() => {
    // Fetch users and group invitations when the component mounts
    dispatch(fetchUsers());
    dispatch(fetchGroupInvitationsForGroup(id));
  }, [dispatch, id]);

  useEffect(() => {
    // Update the invited users map dynamically based on fetched invitations
    const invitesMap = new Map();
    groupInvitations.forEach((invite) => {
      invitesMap.set(invite.invitee.id, { id: invite.id, status: invite.status });
    });
    setInvitedUsers(invitesMap);
  }, [groupInvitations]);

  useEffect(() => {
    // Filter users dynamically based on the search query
    const lowerCaseQuery = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter((user) =>
        user.username.toLowerCase().includes(lowerCaseQuery)
      )
    );
  }, [searchQuery, users]);

  const handleInviteToggle = async (userId) => {
    const existingInvitation = invitedUsers.get(userId);

    if (existingInvitation) {
      // Handle canceling a pending invite
      if (existingInvitation.status === 'Pending') {
        dispatch(deleteGroupInvite(existingInvitation.id))
          .unwrap()
          .then(() => {
            setFeedbackMessage('Invitation canceled successfully!');
            setInvitedUsers((prev) => {
              const updated = new Map(prev);
              updated.delete(userId);
              return updated;
            });
          })
          .catch((error) =>
            setFeedbackMessage(`Error canceling invitation: ${error.message}`)
          );
      } else if (existingInvitation.status === 'Denied') {
        // Resend invite if previously denied
        dispatch(sendGroupInvite({ groupId: id, invitedUserId: userId }))
          .unwrap()
          .then((data) => {
            setFeedbackMessage('Invitation sent successfully!');
            setInvitedUsers((prev) => {
              const updated = new Map(prev);
              updated.set(userId, {
                id: data.invitation.id,
                status: data.invitation.status,
              });
              return updated;
            });
          })
          .catch((error) =>
            setFeedbackMessage(`Error sending invitation: ${error.message}`)
          );
      }
    } else {
      // Send a new invite
      dispatch(sendGroupInvite({ groupId: id, invitedUserId: userId }))
        .unwrap()
        .then((data) => {
          setFeedbackMessage('Invitation sent successfully!');
          setInvitedUsers((prev) => {
            const updated = new Map(prev);
            updated.set(userId, {
              id: data.invitation.id,
              status: data.invitation.status,
            });
            return updated;
          });
        })
        .catch((error) =>
          setFeedbackMessage(`Error sending invitation: ${error.message}`)
        );
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
    return invitation?.status === 'Accepted'; // Disable if status is "Accepted"
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
      <ul className="user-list">
        {filteredUsers.map((user) => (
          <li key={user.id} className="user-item">
            <div className="user-info">
              <img
                src={`https://i.pravatar.cc/50?u=${user.id}`}
                alt="User Avatar"
                className="user-avatar"
              />
              <span className="user-name">{user.username}</span>
            </div>
            <button
              className={`invite-button ${getButtonText(user.id)
                .toLowerCase()
                .replace(' ', '-')}`}
              onClick={() => handleInviteToggle(user.id)}
              disabled={isButtonDisabled(user.id)}
            >
              {getButtonText(user.id)}
            </button>
          </li>
        ))}
        {filteredUsers.length === 0 && searchQuery && (
          <p className="no-results">No users found.</p>
        )}
      </ul>
      {feedbackMessage && <p className="feedback-message">{feedbackMessage}</p>}
    </div>
  );
}

export default GroupInvite;
