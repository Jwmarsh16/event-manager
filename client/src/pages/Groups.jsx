import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGroups, createGroup } from '../redux/groupSlice';

function Groups() {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // useNavigate hook to programmatically navigate
  const groups = useSelector((state) => state.groups.groups);
  const loading = useSelector((state) => state.groups.loading);
  const error = useSelector((state) => state.groups.error);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const newGroup = { name, description };
    const result = await dispatch(createGroup(newGroup));

    if (result.meta.requestStatus === 'fulfilled') {
      // Re-fetch groups to ensure the new group is displayed
      dispatch(fetchGroups());
      // Optionally, navigate to the group page
      navigate(`/groups`);
    }

    setName(''); // Clear the form fields after submission
    setDescription('');
  };

  return (
    <div>
      <h2>Groups</h2>
      <form onSubmit={handleCreateGroup}>
        <input type="text" placeholder="Group Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit">Create Group</button>
      </form>
      {loading && <p>Loading groups...</p>}
      {error && <p>Error: {error}</p>}
      <ul>
        {groups.map((group) => (
          <li key={group.id}>
            <Link to={`/groups/${group.id}`}>{group.name} - {group.description}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Groups;
