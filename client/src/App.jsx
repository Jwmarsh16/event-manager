import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './redux/authSlice'; // Import authentication check thunk
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Events from './pages/Events';
import EventDetail from './components/EventDetail';
import Groups from './pages/Groups';
import GroupDetail from './components/GroupDetail';
import GroupInvite from './components/GroupInvite';
import EventInvite from './components/EventInvite';
import Invitations from './pages/Invitations';
import UserProfile from './pages/UserProfile';
import Home from './pages/Home';
import Goodbye from './components/Goodbye';

function App() {
  const dispatch = useDispatch();

  // Ensure CSRF token is fetched on app load & check authentication status
  useEffect(() => {
    async function fetchCSRFToken() {
      await fetch('/csrf-token', { credentials: 'include' }); // Ensures CSRF token is stored in cookies
    }

    fetchCSRFToken();
    dispatch(checkAuthStatus()); // Ensures user remains authenticated on page refresh
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/invite" element={<EventInvite />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/groups/:id/invite" element={<GroupInvite />} />
        <Route path="/invitations" element={<Invitations />} />
        <Route path="/profile/:id" element={<UserProfile />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/goodbye" element={<Goodbye />} />
      </Routes>
    </Router>
  );
}

export default App;
