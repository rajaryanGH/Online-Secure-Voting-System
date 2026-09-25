import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Ballot({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [hashReceipt, setHashReceipt] = useState('');
  const [hasVoted, setHasVoted] = useState(user.hasVoted);

  useEffect(() => {
    axios.get('http://localhost:5000/api/candidates').then(res => setCandidates(res.data));
  }, []);

  const handleVote = async () => {
    try {
      // 1. Retrieve One-Time Anonymous Voting Token
      const tokenRes = await axios.post('http://localhost:5000/api/vote/get-token', { studentId: user.id });
      const votingToken = tokenRes.data.votingToken;

      // 2. Submit Encrypted Vote anonymously
      const voteRes = await axios.post('http://localhost:5000/api/vote/cast', {
        votingToken,
        candidateId: selected
      });

      setHashReceipt(voteRes.data.currentHash);
      setMessage('Your vote has been anonymously cast and linked to the Hash Chain!');
      setHasVoted(true);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to submit vote');
    }
  };

  if (hasVoted) {
    return (
      <div className="container">
        <h2>Vote Submitted</h2>
        <p className="success">You have already cast your vote.</p>
        {hashReceipt && (
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px', fontSize: '11px', wordBreak: 'break-all' }}>
            <strong>Cryptographic Receipt (Hash):</strong><br />{hashReceipt}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Cast Your Anonymous Vote</h2>
      {candidates.map(c => (
        <div key={c.id} style={{ margin: '15px 0' }}>
          <label style={{ cursor: 'pointer', fontSize: '16px' }}>
            <input 
              type="radio" 
              name="candidate" 
              value={c.id} 
              onChange={() => setSelected(c.id)} 
              style={{ width: 'auto', marginRight: '10px' }}
            />
            {c.name}
          </label>
        </div>
      ))}
      <button disabled={!selected} onClick={handleVote}>
        Submit Anonymous Vote
      </button>
      {message && <p className="error">{message}</p>}
    </div>
  );
}