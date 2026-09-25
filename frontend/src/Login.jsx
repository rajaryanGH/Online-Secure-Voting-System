import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { studentId, password });
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="container">
      <h2>College Voting Portal</h2>
      <p style={{ fontSize: '12px', color: '#666' }}>
        <strong>Students:</strong> STU001 / STU002 / STU003 (Pass: password123)<br />
        <strong>Admin:</strong> ADMIN01 (Pass: admin123)
      </p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleLogin}>
        <input 
          placeholder="User ID (e.g., STU001)" 
          value={studentId} 
          onChange={e => setStudentId(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}