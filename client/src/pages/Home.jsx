import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { resetSearchResults as resetUserSearchResults } from '../redux/userSlice';
import { resetSearchResults as resetEventSearchResults } from '../redux/eventSlice';
import { resetSearchResults as resetGroupSearchResults } from '../redux/groupSlice';
import Search from '../components/Search';
import '../style/HomeStyle.css';

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
    <div className="home-container">
      {/* Hero Section */}
      <header className="hero">
        <div className="hero-overlay">
          <h1>Welcome to Event Manager</h1>
          <p>
            Plan, join, and manage events effortlessly. Connect with users and discover groups tailored to your interests.
          </p>
          <div className="hero-buttons">
            <Link to="/events" className="hero-button">Create an Event</Link>
            <Link to="/groups" className="hero-button">Create a Group</Link>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <Search />

      {/* Featured Sections */}
      <div className="home-columns">
        <div className="home-column">
          <h2>Featured Users</h2>
          {users.length > 0 ? (
            <ul className="featured-users">
              {users.slice(0, 5).map((user) => (
                <li key={user.id} className="featured-user-item">
                  <Link to={`/profile/${user.id}`} className="user-avatar-link">
                    <img
                      src={`https://i.pravatar.cc/50?u=${user.id}`}
                      alt={`${user.username}'s Avatar`}
                      className="user-avatar"
                    />
                  </Link>
                  <Link to={`/profile/${user.id}`} className="user-name-link">
                    {user.username}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users found.</p>
          )}
        </div>

        <div className="home-column">
          <h2>Upcoming Events</h2>
          {events.length > 0 ? (
            <ul>
              {events.slice(0, 5).map((event) => (
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
          <h2>Popular Groups</h2>
          {groups.length > 0 ? (
            <ul>
              {groups.slice(0, 5).map((group) => (
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

      {/* Footer */}
      <footer className="footer">
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

export default Home;
