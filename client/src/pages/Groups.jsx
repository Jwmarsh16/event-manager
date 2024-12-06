import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchGroups, createGroup } from '../redux/groupSlice';
import '../style/GroupsStyle.css';

function Groups() {
  const dispatch = useDispatch();
  const groups = useSelector((state) => state.groups.groups || []); // Ensure it's an array
  const loading = useSelector((state) => state.groups.loading);
  const error = useSelector((state) => state.groups.error);

  const [filteredGroups, setFilteredGroups] = useState(groups); // Initialize with all groups
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Fetch all groups on component mount
  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  // Update filtered groups when groups data changes
  useEffect(() => {
    setFilteredGroups(groups);
  }, [groups]);

  // Filter groups dynamically based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredGroups(
        groups.filter(
          (group) =>
            group.name.toLowerCase().includes(query) ||
            group.description.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, groups]);

  // Handle group creation
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
      <div id="groups-list" className="groups-list-container">
        <h2>Explore Groups</h2>
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Filtered Groups */}
        <div className="groups-list">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div key={group.id} className="group-card">
                <Link to={`/groups/${group.id}`} className="group-link">
                  <h3>{group.name}</h3>
                  <p>{group.description}</p>
                </Link>
              </div>
            ))
          ) : (
            <p>No groups found. Try a different search or create a new group!</p>
          )}
        </div>
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
