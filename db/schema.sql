CREATE TABLE IF NOT EXISTS outdated_clients (
    client_id TEXT PRIMARY KEY,
    timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS overused_clients (
    client_id TEXT PRIMARY KEY,
    timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS cookie (
    cookie TEXT PRIMARY KEY
);