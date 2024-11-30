import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchGroups, createGroup } from '../redux/groupSlice';
import '../style/GroupsStyle.css';
import Search from '../components/Search';

function Groups() {
  const dispatch = useDispatch();
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

    if (!name || !description) {
      alert('Please fill out all fields.');
      return;
    }

    const newGroup = { name, description };
    const result = await dispatch(createGroup(newGroup));

    if (result.meta.requestStatus === 'fulfilled') {
      setName('');
      setDescription('');
    } else {
      alert('Failed to create group. Please try again.');
    }
  };

  return (
    <div className="groups-page">
      {/* Hero Section */}
      <header className="groups-hero">
        <h1>Discover and Create Groups</h1>
        <p>Join communities of like-minded people or start your own group.</p>
        <div className="groups-hero-buttons">
          <a href="#create-group" className="hero-button">Create Group</a>
          <a href="#groups-list" className="hero-button">Browse Groups</a>
        </div>
      </header>

      {/* Search Bar */}
      <Search />

      {/* Create Group Section */}
      <div id="create-group" className="group-form-container">
        <h2>Create a New Group</h2>
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

      {/* Loading or Error Messages */}
      {loading && <p className="loading-message">Loading groups...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {/* Groups List Section */}
      <div id="groups-list" className="groups-list">
        <h2>Explore Groups</h2>
        {groups.map((group) => (
          <div key={group.id} className="group-card">
            <Link to={`/groups/${group.id}`} className="group-link">
              <h3>{group.name}</h3>
              <p>{group.description}</p>
            </Link>
          </div>
        ))}
        {groups.length === 0 && <p>No groups available. Create the first group!</p>}
      </div>

      {/* Footer */}
      <footer className="groups-footer">
        <p>&copy; {new Date().getFullYear()} Event Manager. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

export default Groups;
