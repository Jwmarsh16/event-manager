import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, checkAuthStatus } from '../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import '../style/LoginStyle.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await dispatch(login({ email, password }));

    if (response.meta.requestStatus === 'fulfilled') {
      await dispatch(checkAuthStatus());
      navigate('/');
    } else {
      console.error(
        'Login failed:',
        response.error?.message || 'Invalid credentials',
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        {/* Title */}
        <h1 className="app-title">Event Manager</h1>
        {/* Login Title */}
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
        {error && <p className="login-error">{error}</p>}
        <p className="login-register-text">
          Don't have an account?{' '}
          <Link to="/register" className="login-link">
            Register here
          </Link>
        </p>
        {/* Demo Note */}
        <p className="login-demo-note">
          Note: This application is a demo project showcasing my technical
          capabilities. All data is fake and seeded using Faker.
        </p>
      </div>
    </div>
  );
}

export default Login;
