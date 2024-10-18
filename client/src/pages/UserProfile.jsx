import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfileById } from '../redux/userSlice';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { deleteProfile } from '../redux/authSlice';

function UserProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();  // Use useNavigate instead of useHistory
  const profile = useSelector((state) => state.users.profile);
  const loading = useSelector((state) => state.users.loading);
  const error = useSelector((state) => state.users.error);

  useEffect(() => {
    dispatch(fetchUserProfileById(id));
  }, [dispatch, id]);

  // Function to handle profile deletion
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your profile? This action is irreversible.")) {
      dispatch(deleteProfile())
        .then(() => {
          navigate('/goodbye');  // Use navigate instead of history.push
        })
        .catch((error) => {
          console.error('Error deleting profile:', error);
        });
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="user-profile">
      <h3>{profile?.username}'s Profile</h3>
      {profile && (
        <>
          <p>Email: {profile.email}</p>

          <h3>Groups:</h3>
          <ul>
            {profile.groups.map(group => (
              <li key={group.id}>
                <Link to={`/groups/${group.id}`}>{group.name}</Link>
              </li>
            ))}
          </ul>

          <h3>Events:</h3>
          <ul>
            {profile.events.map(event => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`}>{event.name}</Link> - {event.rsvp_status}
              </li>
            ))}
          </ul>

          {/* Add the delete profile button */}
          <button onClick={handleDelete} className="delete-button" style={{ marginTop: '20px', color: 'red' }}>
            Delete Profile
          </button>
        </>
      )}
    </div>
  );
}

export default UserProfile;
