cat > README.md << 'EOF'
# QuantumVote — Post-Quantum Secure E-Voting System

SDG 16 — Peace, Justice & Strong Institutions

## Setup

### Backend
```bash
cd quantumvote
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn phe pycryptodome python-dotenv
python crypto_core.py   # test crypto
python database.py      # test database
uvicorn main:app --reload
```

### Frontend
```bash
cd quantumvote-frontend
npm install
npm start
```

## Architecture
- `crypto_core.py` — Paillier HE + PQ signatures + nullifiers
- `database.py`    — SQLite schema, no voter identity stored
- `main.py`        — FastAPI, 5 routes

## Cryptographic Stack
- CRYSTALS-Dilithium (simulated) — post-quantum signatures
- Paillier Homomorphic Encryption — private vote tallying
- SHA3-256 nullifiers — double-vote prevention
- HMAC-SHA3 commitments — anonymous registration
EOF
