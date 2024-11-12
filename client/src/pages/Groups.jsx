import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGroups, createGroup } from '../redux/groupSlice';
import '../style/GroupsStyle.css';

function Groups() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
      dispatch(fetchGroups());
      navigate(`/groups`);
    }

    setName('');
    setDescription('');
  };

  return (
    <div className="groups-page">
      <h2>Groups</h2>
      
      <div className="group-form-container">
        <form onSubmit={handleCreateGroup} className="group-form">
          <input 
            type="text" 
            placeholder="Group Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
          />
          <textarea 
            placeholder="Description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required
          />
          <button type="submit">Create Group</button>
        </form>
      </div>

      {loading && <p className="loading-message">Loading groups...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      
      <div className="groups-list">
        {groups.map((group) => (
          <div key={group.id} className="group-card">
            <Link to={`/groups/${group.id}`} className="group-link">
              <h3>{group.name}</h3>
              <p>{group.description}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Groups;
