const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'college_super_secret_voting_key_2026';
let db;

// ----------------------------------------------------
// DATABASE INITIALIZATION (SQLite)
// ----------------------------------------------------
async function initDB() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Table 1: Users
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      has_voted INTEGER DEFAULT 0,
      role TEXT DEFAULT 'student'
    );
  `);

  // Table 2: Active Unused Anonymous Voting Tokens
  await db.exec(`
    CREATE TABLE IF NOT EXISTS active_tokens (
      token TEXT PRIMARY KEY
    );
  `);

  // Table 3: Votes Hash Chain Ledger (No User Info Linked!)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      current_hash TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // Seed default users if table is empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const defaultPasswordHash = bcrypt.hashSync('password123', 8);
    const adminPasswordHash = bcrypt.hashSync('admin123', 8);

    await db.run('INSERT INTO users VALUES (?, ?, ?, 0, ?)', ['STU001', 'Alice', defaultPasswordHash, 'student']);
    await db.run('INSERT INTO users VALUES (?, ?, ?, 0, ?)', ['STU002', 'Bob', defaultPasswordHash, 'student']);
    await db.run('INSERT INTO users VALUES (?, ?, ?, 0, ?)', ['STU003', 'Charlie', defaultPasswordHash, 'student']);
    await db.run('INSERT INTO users VALUES (?, ?, ?, 0, ?)', ['ADMIN01', 'Prof. Smith', adminPasswordHash, 'admin']);

    console.log('Database initialized with default accounts (STU001, STU002, STU003, ADMIN01).');
  }
}

initDB().catch(console.error);

// Helper function to generate SHA-256 Hash
function createHash(candidateId, prevHash, timestamp) {
  return crypto
    .createHash('sha256')
    .update(`${candidateId}-${prevHash}-${timestamp}`)
    .digest('hex');
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  const { studentId, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE id = ?', [studentId]);

  if (!user) {
    return res.status(400).json({ error: 'Invalid Student ID or User not found' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, hasVoted: Boolean(user.has_voted), role: user.role }
  });
});

// 2. GET CANDIDATES
app.get('/api/candidates', (req, res) => {
  res.json([
    { id: 'CAND_A', name: 'Candidate A (Alex)' },
    { id: 'CAND_B', name: 'Candidate B (Bella)' },
    { id: 'CAND_C', name: 'Candidate C (Chris)' }
  ]);
});

// 3. STAGE 1: GET ANONYMOUS VOTING TOKEN
app.post('/api/vote/get-token', async (req, res) => {
  const { studentId } = req.body;
  const user = await db.get('SELECT * FROM users WHERE id = ?', [studentId]);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.has_voted === 1) return res.status(403).json({ error: 'You have already voted!' });

  // Mark user as voted in DB immediately
  await db.run('UPDATE users SET has_voted = 1 WHERE id = ?', [studentId]);

  // Generate 32-byte cryptographic token
  const votingToken = crypto.randomBytes(32).toString('hex');
  await db.run('INSERT INTO active_tokens (token) VALUES (?)', [votingToken]);

  res.json({ success: true, votingToken });
});

// 4. STAGE 2: CAST ANONYMOUS VOTE
app.post('/api/vote/cast', async (req, res) => {
  const { votingToken, candidateId } = req.body;

  // Validate Token
  const tokenRecord = await db.get('SELECT * FROM active_tokens WHERE token = ?', [votingToken]);
  if (!tokenRecord) {
    return res.status(401).json({ error: 'Invalid or already used voting token!' });
  }

  // Consume token immediately
  await db.run('DELETE FROM active_tokens WHERE token = ?', [votingToken]);

  // Fetch last vote's hash
  const lastVote = await db.get('SELECT current_hash FROM votes ORDER BY id DESC LIMIT 1');
  const prevHash = lastVote ? lastVote.current_hash : 'GENESIS_HASH';
  const timestamp = new Date().toISOString();
  const currentHash = createHash(candidateId, prevHash, timestamp);

  // Insert into hash chain ledger
  await db.run(
    'INSERT INTO votes (candidate_id, previous_hash, current_hash, timestamp) VALUES (?, ?, ?, ?)',
    [candidateId, prevHash, currentHash, timestamp]
  );

  res.json({ success: true, message: 'Vote recorded in tamper-evident ledger!', currentHash });
});

// 5. ADMIN: RESULTS & LEDGER INTEGRITY AUDIT
app.get('/api/admin/results', async (req, res) => {
  const allVotes = await db.all('SELECT * FROM votes ORDER BY id ASC');

  // Compute Tally
  const tally = { CAND_A: 0, CAND_B: 0, CAND_C: 0 };
  allVotes.forEach(v => {
    if (tally[v.candidate_id] !== undefined) tally[v.candidate_id]++;
  });

  // Verify Hash Chain Integrity
  let isLedgerValid = true;
  for (let i = 0; i < allVotes.length; i++) {
    const current = allVotes[i];
    const prevHash = i === 0 ? 'GENESIS_HASH' : allVotes[i - 1].current_hash;
    const recalculatedHash = createHash(current.candidate_id, prevHash, current.timestamp);

    if (recalculatedHash !== current.current_hash) {
      isLedgerValid = false;
      break;
    }
  }

  res.json({
    totalVotes: allVotes.length,
    tally,
    isLedgerValid,
    ledger: allVotes
  });
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));