# 🔒 Online Secure Voting System

A campus-scale, tamper-evident digital voting platform built with **React**, **Node.js (Express)**, and **SQLite**. 

Designed to ensure complete voter anonymity while providing cryptographic verifiability via a **Two-Stage Anonymous Token Engine** and a **SHA-256 Hash-Chain Ledger**.

---

## 🌟 Key Features
* **Two-Stage Anonymous Voting:** Decouples student identity from the cast ballot using single-use 32-byte cryptographic tokens.
* **Tamper-Evident Ledger:** Implements a SHA-256 hash chain (`Hash = SHA256(CandidateID + PrevHash + Timestamp)`) to detect database alterations.
* **Double-Voting Prevention:** Tracks voting eligibility (`has_voted`) while keeping vote choices completely anonymous.
* **Admin Audit Dashboard:** Displays real-time turnout stats, candidate tallies, and automated cryptographic chain integrity checks (`INTEGRITY VERIFIED` / `TAMPER DETECTED`).

---

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite, Axios
* **Backend:** Node.js, Express.js, JWT, bcryptjs
* **Database:** SQLite3
* **Security:** Node `crypto` module (SHA-256, `randomBytes`)


