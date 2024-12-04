import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfileById } from '../redux/userSlice';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { deleteProfile } from '../redux/authSlice';
import { FaUserCircle } from 'react-icons/fa';
import '../style/UserProfileStyle.css';

function UserProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector((state) => state.users.profile);
  const loading = useSelector((state) => state.users.loading);
  const error = useSelector((state) => state.users.error);

  useEffect(() => {
    dispatch(fetchUserProfileById(id)); // Fetch profile details on mount
  }, [dispatch, id]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your profile? This action is irreversible.")) {
      dispatch(deleteProfile()).then(() => {
        navigate('/goodbye');
      });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <FaUserCircle size={90} className="profile-icon" />
        <h2>{profile?.username}</h2>
        <p className="profile-email">{profile?.email}</p>
      </div>

      <div className="profile-section">
        <h3>Groups</h3>
        {profile?.groups.length > 0 ? (
          <ul className="profile-list">
            {profile.groups.map((group) => (
              <li key={group.id} className="profile-list-item">
                <Link to={`/groups/${group.id}`}>{group.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No groups found.</p>
        )}
      </div>

      <div className="profile-section">
        <h3>Events</h3>
        {profile?.events.length > 0 ? (
          <ul className="profile-list">
            {profile.events.map((event) => (
              <li key={event.id} className="profile-list-item">
                <Link to={`/events/${event.id}`}>{event.name}</Link> - {event.rsvp_status}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events found.</p>
        )}
      </div>

      <button onClick={handleDelete} className="delete-button">
        Delete Profile
      </button>
    </div>
  );
}

export default UserProfile;
