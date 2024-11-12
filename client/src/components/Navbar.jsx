import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, resetAuthState } from '../redux/authSlice';
import '../style/NavbarStyle.css';

function Navbar() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const result = await dispatch(logout());
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(resetAuthState());
        navigate('/login');
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
          <Link to="/" className="navbar-button">Home</Link>
        </li>
        {isAuthenticated ? (
          <>
            <li className={window.location.pathname === '/events' ? 'active' : ''}>
              <Link to="/events" className="navbar-button">Events</Link>
            </li>
            <li className={window.location.pathname === '/groups' ? 'active' : ''}>
              <Link to="/groups" className="navbar-button">Groups</Link>
            </li>
            <li className={window.location.pathname === `/profile/${currentUserId}` ? 'active' : ''}>
              <Link to={`/profile/${currentUserId}`} className="navbar-button">Profile</Link>
            </li>
            <li className={window.location.pathname === '/invitations' ? 'active' : ''}>
              <Link to="/invitations" className="navbar-button">Invitations</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="navbar-button">Logout</button>
            </li>
          </>
        ) : (
          <>
            <li className={window.location.pathname === '/login' ? 'active' : ''}>
              <Link to="/login" className="navbar-button">Login</Link>
            </li>
            <li className={window.location.pathname === '/register' ? 'active' : ''}>
              <Link to="/register" className="navbar-button">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
