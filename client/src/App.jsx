import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './redux/authSlice'; // Import authentication check thunk
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
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

  useEffect(() => {
    async function initializeApp() {
      try {
        const csrfResponse = await fetch('/api/csrf-token', {
          credentials: 'include',
        });

        if (!csrfResponse.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        dispatch(checkAuthStatus()); // Ensure authentication check runs on app load
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    }

    initializeApp();
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/events/:id/invite" element={<EventInvite />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/groups/:id/invite" element={<GroupInvite />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>

        {/* Public Route */}
        <Route path="/goodbye" element={<Goodbye />} />
      </Routes>
    </Router>
  );
}

export default App;
