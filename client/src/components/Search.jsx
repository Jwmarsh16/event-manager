import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import debounce from 'lodash.debounce';
import { searchUsers, resetSearchResults as resetUserSearchResults } from '../redux/userSlice';
import { searchEvents, resetSearchResults as resetEventSearchResults } from '../redux/eventSlice';
import { searchGroups, resetSearchResults as resetGroupSearchResults } from '../redux/groupSlice';

function Search() {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();

  const handleSearch = debounce((q) => {
    if (q.trim()) {
      dispatch(searchUsers(q));
      dispatch(searchEvents(q));
      dispatch(searchGroups(q));
    } else {
      dispatch(resetUserSearchResults());
      dispatch(resetEventSearchResults());
      dispatch(resetGroupSearchResults());
    }
  }, 300); // 300ms debounce delay

  useEffect(() => {
    handleSearch(query);
    return () => handleSearch.cancel(); // Cancel debounce on cleanup
  }, [query]);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search users, events, groups..."
        value={query}
        onChange={handleChange}
      />
    </div>
  );
}

export default Search;
