import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { resetSearchResults as resetUserSearchResults } from '../redux/userSlice';
import { resetSearchResults as resetEventSearchResults } from '../redux/eventSlice';
import { resetSearchResults as resetGroupSearchResults } from '../redux/groupSlice';
import Search from '../components/Search';

function Home() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Reset search results when the Home component mounts
    dispatch(resetUserSearchResults());
    dispatch(resetEventSearchResults());
    dispatch(resetGroupSearchResults());
  }, [dispatch]);

  const users = useSelector((state) => state.users.searchResults || []);
  const events = useSelector((state) => state.events.searchResults || []);
  const groups = useSelector((state) => state.groups.searchResults || []);

  return (
    <div>
      <h1>Welcome to the Event Manager</h1>
      <Search />
      
      <div className="home-columns">
        <div className="home-column">
          <h2>Users</h2>
          {users.length > 0 ? (
            <ul>
              {users.map(user => (
                <li key={user.id}>
                  <Link to={`/profile/${user.id}`}>{user.username}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users found.</p>
          )}
        </div>

        <div className="home-column">
          <h2>Events</h2>
          {events.length > 0 ? (
            <ul>
              {events.map(event => (
                <li key={event.id}>
                  <Link to={`/events/${event.id}`}>{event.name}</Link> - {new Date(event.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No events found.</p>
          )}
        </div>

        <div className="home-column">
          <h2>Groups</h2>
          {groups.length > 0 ? (
            <ul>
              {groups.map(group => (
                <li key={group.id}>
                  <Link to={`/groups/${group.id}`}>{group.name}</Link> - {group.description}
                </li>
              ))}
            </ul>
          ) : (
            <p>No groups found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
