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
    if (window.confirm('Are you sure you want to delete this group?')) {
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
    <div className="group-detail-page">
      {group && (
        <>
          {/* Hero Section */}
          <header className="group-hero">
            <h1>{group.name}</h1>
            <p>{group.description}</p>
          </header>

          {/* Group Stats Section */}
          <section className="group-stats">
            <p><strong>Members:</strong> {group.members.length}</p>
            <p><strong>Created On:</strong> {new Date(group.created_at).toLocaleDateString()}</p>
          </section>

          {/* Members Section */}
          <div className="members-section">
            <h3 className="members-title">Members</h3>
            <ul className="members-list">
              {group.members.map((member) => (
                <li key={member.id} className="member-item">
                  <Link to={`/profile/${member.id}`} className="member-avatar-link">
                    <img
                      src={`https://i.pravatar.cc/50?u=${member.id}`}
                      alt={`${member.username}'s Avatar`}
                      className="member-avatar"
                    />
                  </Link>
                  <Link to={`/profile/${member.id}`} className="member-name-link">
                    {member.username}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Invite Users Button */}
            {currentUserId === group.user_id && (
              <Link to={`/groups/${group.id}/invite`} className="invite-button">
                <FaUserPlus /> Invite Users
              </Link>
            )}
          </div>

          {/* Delete Button */}
          {currentUserId === group.user_id && (
            <button onClick={handleDelete} className="delete-button" title="Delete Group">
              <FaTrashAlt /> Delete Group
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default GroupDetail;
