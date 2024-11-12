import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGroupById, deleteGroup } from '../redux/groupSlice';
import '../style/GroupDetailStyle.css';
import { FaTrashAlt, FaUserPlus } from 'react-icons/fa';

function GroupDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const group = useSelector((state) => state.groups.currentGroup);
  const loading = useSelector((state) => state.groups.loading);
  const error = useSelector((state) => state.groups.error);
  const currentUserId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    dispatch(fetchGroupById(id));
  }, [dispatch, id]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      dispatch(deleteGroup(id)).then(() => navigate(`/profile/${currentUserId}`));
    }
  };

  if (loading) {
    return <p className="loading-message">Loading group details...</p>;
  }

  if (error) {
    return <p className="error-message">Error: {error}</p>;
  }

  return (
    <div className="group-detail-container">
      {group && (
        <div className="group-card">
          <div className="group-header">
            <h2 className="group-title">{group.name}</h2>
            {/* Only show delete button if the current user is the creator of the group */}
            {currentUserId === group.user_id && (
              <button onClick={handleDelete} className="delete-button" title="Delete Group">
                <FaTrashAlt /> Delete Group
              </button>
            )}
          </div>
          <p className="group-description">{group.description}</p>

          <div className="members-section">
            <h3 className="members-title">Members</h3>
            <ul className="members-list">
              {group.members.map((member) => (
                <li key={member.id} className="member-item">
                  {member.username}
                </li>
              ))}
            </ul>
          </div>

          {/* Only the creator of the group should see the Invite Users button */}
          {currentUserId === group.user_id && (
            <Link to={`/groups/${group.id}/invite`} className="invite-button">
              <FaUserPlus /> Invite Users
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default GroupDetail;
