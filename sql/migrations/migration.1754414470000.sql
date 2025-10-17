CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    totp_secret TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE passkey (
    id TEXT PRIMARY KEY,
    public_key BYTEA NOT NULL,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    webauthn_id TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_type VARCHAR(32) NOT NULL,
    backed_up BOOLEAN NOT NULL DEFAULT FALSE,
    transport VARCHAR(255) NOT NULL DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

