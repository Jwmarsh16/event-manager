import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { searchUsers, resetSearchResults as resetUserSearchResults } from '../redux/userSlice';
import { searchEvents, resetSearchResults as resetEventSearchResults } from '../redux/eventSlice';
import { searchGroups, resetSearchResults as resetGroupSearchResults } from '../redux/groupSlice';
import '../style/SearchStyle.css'; // Add a separate CSS file for search-specific styles

function Search() {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();

  const handleSearch = (e) => {
    e.preventDefault();

    if (query.trim()) {
      dispatch(searchUsers(query));
      dispatch(searchEvents(query));
      dispatch(searchGroups(query));
    } else {
      dispatch(resetUserSearchResults());
      dispatch(resetEventSearchResults());
      dispatch(resetGroupSearchResults());
    }
  };

  return (
    <div className="search-container">
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Search users, events, groups..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-button" type="submit">Search</button>
      </form>
    </div>
  );
}

export default Search;
