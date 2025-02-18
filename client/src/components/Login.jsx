import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import '../style/LoginStyle.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth); // Track loading & errors

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await dispatch(login({ email, password }));

    if (response.meta.requestStatus === 'fulfilled') {
      await dispatch(checkAuthStatus()); // Ensure UI updates before redirecting
      navigate('/');
    } else {
      console.error(
        'Login failed:',
        response.error.message || 'Invalid credentials',
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h2 className="login-title">Login</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}{' '}
        {/* Display login errors */}
        <p className="login-register-text">
          Don't have an account?{' '}
          <Link to="/register" className="login-link">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
