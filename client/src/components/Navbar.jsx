import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, resetAuthState } from '../redux/authSlice';

function Navbar() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const result = await dispatch(logout());
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(resetAuthState()); // Reset auth state immediately after successful logout
        console.log('Logout successful, navigating to /login');
        navigate('/login'); // Navigate to the login page
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav>
      <ul>
        <li className={window.location.pathname === '/' ? 'active' : ''}>
          <Link to="/">Home</Link>
        </li>
        {isAuthenticated ? (
          <>
            <li className={window.location.pathname === '/events' ? 'active' : ''}>
              <Link to="/events">Events</Link>
            </li>
            <li className={window.location.pathname === '/groups' ? 'active' : ''}>
              <Link to="/groups">Groups</Link>
            </li>
            <li className={window.location.pathname === `/profile/${currentUserId}` ? 'active' : ''}>
              <Link to={`/profile/${currentUserId}`}>Profile</Link>
            </li>
            <li className={window.location.pathname === '/invitations' ? 'active' : ''}>
              <Link to="/invitations">Invitations</Link>
            </li>
            <li>
              <button className="button" onClick={handleLogout}>Logout</button>
            </li>
          </>
        ) : (
          <>
            <li className={window.location.pathname === '/login' ? 'active' : ''}>
              <Link to="/login">Login</Link>
            </li>
            <li className={window.location.pathname === '/register' ? 'active' : ''}>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
