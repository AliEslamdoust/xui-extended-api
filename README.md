# **This Porject Is Deprecated As Of 6/10/2026**
# X-UI Extended API

This project provides an extended API for managing the [X-UI](https://github.com/MHSanaei/3x-ui) panel, offering advanced features for client synchronization, usage monitoring, and automated management.

## Features

- **Client Management**: Add, remove, and update clients across multiple inbounds.
- **Client Synchronization**: Automatically sync client data at configurable intervals.
- **Usage Monitoring**: Track and flagged overused or outdated clients.
- **X-Ray Management**: Remotely restart the X-Ray core.
- **Database Backend**: Uses SQLite to persist client status (e.g., depleted/expired) and settings.
- **Secure Access**: Protected via a configurable access code.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/AliEslamdoust/xui-extended-api.git
    cd xui-extended-api
    ```

2.  **Configuration:**

    - **Application Config:**
      Copy the template configuration file:

      ```bash
      cp config/config.template.yaml config/config.yaml
      ```

      Edit `config/config.yaml` with your X-UI credentials, API port, and desired access code.

    - **Environment Variables:**
      Create the `.env` file from the template:
      ```bash
      cp .env.template .env
      ```
      Edit `.env` to match the port defined in your `config.yaml` (default: 5594).

3.  **Start the Server (Docker):**

    Build and run the container using Docker Compose:

    ```bash
    ./start.sh
    ```

    The server will start on the port specified in your configuration (default: 5594).

## Configuration

### On .env:
- **port**: The port the API server will listen on.
- **xui credentials**: Credentials for the X-UI panel you are managing.

### On config.yaml:
- **API_KEY**: The API key created from by running `./start.sh` which is required in the header to authenticate requests.
- **xui address and inbounds**: URL for the X-UI panel you are managing, and the ids of inbounds which you want to be managed by the script.

## API Documentation

**Authentication**:
All API endpoints require the `API_KEY` header.

- **Header Key**: `API_KEY`
- **Value**: Your configured access code (from `config.yaml`).

### System

#### `GET /api/reload`

Reloads the database and configuration settings without restarting the Node.js process.

#### `GET /api/newApiKey`

Generates a new API key for the application.

#### `POST /api/changePanelAddress`

Updates the X-UI panel address in the configuration.

- **Body**:
  - `url`: The new X-UI panel URL (e.g., `http://127.0.0.1:54321`).

#### `POST /api/changePanelInbounds`

Updates the configured Inbound IDs.

- **Body**:
  - `inbounds`: An array of inbound IDs (e.g., `[1, 2, 3]`).

#### `GET /api/restartXray`

Triggers a restart of the X-Ray core on the connected X-UI server.

### Synchronization

#### `GET /api/startSync`

Starts the background client synchronization process.

- **Query Params**:
  - `timer`: (Optional) Interval in seconds for synchronization (default: 30).

#### `GET /api/stopSync`

Stops the client synchronization process.

### Client Management

#### `POST /api/addClient`

Adds a new client to X-UI.

- **Body**:
  - `client`: The client object to add.

#### `POST /api/updateClient`

Updates an existing client in X-UI.

- **Body**:
  - `client`: The client object containing updated fields.

#### `POST /api/removeClient`

Removes a client from X-UI.

- **Body**:
  - `client`: The client object (must include `id` and `inbound`).

#### `POST /api/changeClientUsage`

Modifies a client's usage statistics.

- **Body**:
  - `client`: The client object with usage data.

#### `GET /api/getClient/:subId`

Retrieves full information for a specific client by their Subscription ID.

#### `GET /api/getAllClients`

Retrieves a list of all clients and their full information.

#### `GET /api/getAllSubIds`

Retrieves a list of all client Subscription IDs.

#### `GET /api/SIDbyID/:id`

Retrieves a client's Subscription ID using their UUID.

#### `GET /api/SIDbyEmail/:email`

Retrieves a client's Subscription ID using their email address.

### Usage & Depletion

#### `GET /api/getFinishedClient`

Retrieves a list of clients that are flagged as overused or outdated (depleted).

#### `POST /api/setDepletedFlag`

Manually sets or unsets the depleted status for a client.

- **Body**:
  ```json
  {
    "data": {
      "subId": "client_sub_id_string",
      "isDepleted": true // or false
    }
  }
  ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
