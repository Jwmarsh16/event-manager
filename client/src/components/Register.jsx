import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../redux/authSlice';
import '../style/RegisterStyle.css'; // Import the new CSS file

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const validate = () => {
    const newErrors = {};

    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3 || username.length > 80) {
      newErrors.username = 'Username must be between 3 and 80 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      newErrors.username = 'Username must contain only letters, numbers, and underscores';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least one digit';
    }

    return newErrors;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    dispatch(registerUser({ username, email, password })).then((response) => {
      if (response.meta.requestStatus === 'fulfilled') {
        navigate('/login'); // navigate to login page on successful registration
      }
    });
  };

  return (
    <div className="register-container">
      <div className="register-form-wrapper">
        <h2 className="register-title">Register</h2>
        <form className="register-form" onSubmit={handleRegister}>
          <div>
            <input
              type="text"
              className="register-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && <p className="error-text">{errors.username}</p>}
          </div>
          <div>
            <input
              type="email"
              className="register-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div>
            <input
              type="password"
              className="register-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          <button type="submit" className="register-button" disabled={loading}>
            Register
          </button>
        </form>
        {loading && <p className="info-text">Registering...</p>}
        {error && <p className="error-text">Error: {error}</p>}
      </div>
    </div>
  );
}

export default Register;
