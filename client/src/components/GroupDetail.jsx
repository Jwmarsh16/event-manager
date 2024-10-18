import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGroupById, deleteGroup } from '../redux/groupSlice'; // Import deleteGroup action

function GroupDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Hook to navigate after deletion
  const group = useSelector((state) => state.groups.currentGroup);
  const loading = useSelector((state) => state.groups.loading);
  const error = useSelector((state) => state.groups.error);
  const currentUserId = useSelector((state) => state.auth.user?.id);
  
  useEffect(() => {
    dispatch(fetchGroupById(id));
  }, [dispatch, id]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      dispatch(deleteGroup(id))
        .then(() => {
          navigate(`/profile/${currentUserId}`); // Navigate back to the groups list after deletion
        })
        .catch(err => {
          console.error("Failed to delete group:", err);
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
    <div>
      <h2>Group Details</h2>
      {group && (
        <div>
          <p><strong>Name:</strong> {group.name}</p>
          <p><strong>Description:</strong> {group.description}</p>
          <button onClick={handleDelete}>Delete Group</button> {/* Delete button */}
          <h3>Members:</h3>
          <ul>
            {group.members.map(member => (
              <li key={member.id}>{member.username}</li>
            ))}
          </ul>
          <Link to={`/groups/${group.id}/invite`}>
            <button>Invite Users</button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default GroupDetail;
