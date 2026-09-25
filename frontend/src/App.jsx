import React, { useState } from 'react';
import Login from './Login';
import Ballot from './Ballot';
import Admin from './Admin';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => setUser(null);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span>Logged in as: <strong>{user.name}</strong> ({user.role}) </span>
        <button onClick={handleLogout} style={{ width: 'auto', padding: '6px 12px', marginLeft: '10px' }}>Logout</button>
      </div>
      {user.role === 'admin' ? <Admin /> : <Ballot user={user} />}
    </div>
  );
}