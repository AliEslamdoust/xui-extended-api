# X-UI Extended API

This project provides an extended API for managing the [X-UI](https://github.com/MHSanaei/3x-ui) panel, adding additional features for client synchronization and usage monitoring.

## Features

- **Client Management**: Add, remove, and update clients to multiple inbounds (great for multi-inbound servers).
- **Client Synchronization**: Automatically sync client data.
- **Usage Monitoring**: Track overused and outdated clients.
- **X-Ray Management**: Restart X-Ray core remotely.
- **Database**: Uses SQLite for storing client status (overused/outdated) and settings.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd xui-extended-api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configuration:**

    - Copy the template config file:
      ```bash
      cp db/config.template.yaml db/config.yaml
      ```
    - Edit `db/config.yaml` with your X-UI credentials, database path (if local), and desired API access code.

4.  **Database Setup:**
    The SQLite database (`db/db.sqlite`) will be automatically created on the first run.

## Usage

Start the server using node:

```bash
node index.js
```

The server will start on the port specified in `db/config.yaml` (default: 5594).

## API Documentation

All API endpoints require the `accesscode` header for authentication. This access code is defined in your `db/config.yaml`.

### Authentication

**Header:**

- `accesscode`: Your configured access code.

### Endpoints

#### `GET /api/startSync/`

Starts the client synchronization interval.

- **Query Params:**
  - `timer`: Interval (in seconds) for synchronization.

#### `GET /api/stopSync`

Stops the client synchronization interval.

#### `POST /api/updateClient`

Updates a client in X-UI.

- **Body:**
  - `client`: Client object to update.

#### `POST /api/removeClient`

Removes a client from X-UI.

- **Body:**
  - `client`: Client object (must include `id` and `inbound`).

#### `POST /api/addClient`

Adds a client to X-UI.

- **Body:**
  - `client`: Client object to add.

#### `POST /api/changeClientUsage`

Changes a client's usage stats in X-UI.

- **Body:**
  - `client`: Client object.

#### `GET /api/getClient/:subId`

Retrieves full client information by Subscription ID (subId).

#### `GET /api/getFinishedClient`

Retrieves a list of all overused and outdated clients with their expiration timestamps.

#### `GET /api/stopClientSyncing/:subId`

Stops synchronization for a specific client (adds to overused/outdated list). Useful for manually disabling a client.

#### `GET /api/syncClient/:subId`

Resumes synchronization for a specific client (removes from overused/outdated list).

#### `GET /api/reload`

Reloads the database and `config.yaml` settings without restarting the server.

#### `POST /api/updatePassword`

Updates the API access code hash in `config.yaml`.

- **Headers:**
  - `password`: The new password to hash and store.

#### `GET /api/SIDbyID/:id`

Retrieves a client's Subscription ID (subId) using their UUID.

#### `GET /api/SIDbyEmail/:email`

Retrieves a client's Subscription ID (subId) using their email.

#### `GET /api/restartXray`

Triggers a restart of the X-Ray core on the server.
