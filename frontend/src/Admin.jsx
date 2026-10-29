import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Admin() {
  const [data, setData] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

useEffect(() => {
  axios.get(`${API_URL}/api/admin/results`).then(res => setData(res.data));
}, []);

  if (!data) return <div className="container"><p>Loading audit logs...</p></div>;

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <h2>Election Audit Dashboard</h2>
      <p><strong>Total Ballots Cast:</strong> {data.totalVotes}</p>
      <p>
        <strong>Ledger Status:</strong>{' '}
        <span className={`badge ${data.isLedgerValid ? 'badge-green' : 'badge-red'}`}>
          {data.isLedgerValid ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED'}
        </span>
      </p>

      <h3>Candidate Results</h3>
      <ul>
        {Object.entries(data.tally).map(([candidateId, count]) => (
          <li key={candidateId} style={{ fontSize: '16px', margin: '5px 0' }}>
            <strong>{candidateId}:</strong> {count} vote(s)
          </li>
        ))}
      </ul>

      <h3>Tamper-Evident Ledger (SQLite Hash Chain)</h3>
      <div style={{ background: '#1e1e1e', color: '#00ff00', padding: '15px', borderRadius: '6px', fontSize: '11px', overflowX: 'auto' }}>
        <pre>{JSON.stringify(data.ledger, null, 2)}</pre>
      </div>
    </div>
  );
}