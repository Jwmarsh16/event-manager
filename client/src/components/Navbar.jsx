import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, resetAuthState, checkAuthStatus } from '../redux/authSlice';
import '../style/NavbarStyle.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Ensure authentication state updates on page load
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      const result = await dispatch(logout());

      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(resetAuthState());
        await fetch('/api/csrf-token', { credentials: 'include' }); // Fetch a new CSRF token after logout
        navigate('/login');
        setMenuOpen(false);
      } else {
        console.error('Logout failed:', result.error.message);
      }
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav>
      <button className="navbar-toggle" onClick={toggleMenu}>
        ☰
      </button>
      <ul className={menuOpen ? 'active' : ''}>
        <li className={window.location.pathname === '/' ? 'active' : ''}>
          <Link to="/" className="navbar-button" onClick={closeMenu}>
            Home
          </Link>
        </li>
        {isAuthenticated ? (
          <>
            <li
              className={
                window.location.pathname === `/profile/${currentUserId}`
                  ? 'active'
                  : ''
              }
            >
              <Link
                to={`/profile/${currentUserId}`}
                className="navbar-button"
                onClick={closeMenu}
              >
                Profile
              </Link>
            </li>
            <li
              className={window.location.pathname === '/events' ? 'active' : ''}
            >
              <Link to="/events" className="navbar-button" onClick={closeMenu}>
                Events
              </Link>
            </li>
            <li
              className={window.location.pathname === '/groups' ? 'active' : ''}
            >
              <Link to="/groups" className="navbar-button" onClick={closeMenu}>
                Groups
              </Link>
            </li>
            <li
              className={
                window.location.pathname === '/invitations' ? 'active' : ''
              }
            >
              <Link
                to="/invitations"
                className="navbar-button"
                onClick={closeMenu}
              >
                Invitations
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="navbar-button logout-button"
                disabled={!isAuthenticated}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li
              className={window.location.pathname === '/login' ? 'active' : ''}
            >
              <Link to="/login" className="navbar-button" onClick={closeMenu}>
                Login
              </Link>
            </li>
            <li
              className={
                window.location.pathname === '/register' ? 'active' : ''
              }
            >
              <Link
                to="/register"
                className="navbar-button"
                onClick={closeMenu}
              >
                Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
