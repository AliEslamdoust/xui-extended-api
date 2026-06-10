> ### ⚠️ Architectural Archival Notice (June 2026)
> This repository has been safely frozen and archived. The core multi-node client 
> synchronization capabilities built into this extended API middleware have been natively 
> upstreamed into the main [3X-UI panel by MHSanaei](https://github.com/MHSanaei/3x-ui). 
> This codebase remains public strictly as a high-quality portfolio asset demonstrating 
> advanced multi-inbound traffic aggregation, custom database synchronization algorithms, 
> and RESTful microservice engineering.

# X-UI Extended API

This project provides an extended API for managing the [X-UI](https://github.com/MHSanaei/3x-ui) panel, offering advanced features for client synchronization, usage monitoring, and automated management.

## Features

- **Client Management**: Add, remove, and update clients across multiple inbounds.
- **Client Synchronization**: Automatically sync client data at configurable intervals.
- **Usage Monitoring**: Track and flagged overused or outdated clients.
- **X-Ray Management**: Remotely restart the X-Ray core.
- **Database Backend**: Uses SQLite to persist client status (e.g., depleted/expired) and settings.
- **Secure Access**: Protected via a configurable access code.

### Key Technical Solutions Implemented

- **Multi-Inbound Data Aggregation**: Solved the 3X-UI structural restriction where multi-hop 
  VPN tunneling configurations required separate client profiles. This system automatically 
  combines ingress/egress metrics (`up`, `down` bytes) across disparate node IDs using 
  aggregated relational mapping keys.
- **Relational Mapping Engine**: Built precise reverse-lookup hooks mapping user 
  UUIDs (`SIDbyID/:id`) and Emails (`SIDbyEmail/:email`) back to unified unique Subscription IDs.

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

## Configuration & Deployment Logistics

### Environment Variables (`.env`)
The local runtime behavior is controlled via standard environment variables:
- `PORT`: The explicit port interface the Express API server will bind to (Default: `5594`).

### Configuration File (`config/config.yaml`)
Core integration metrics are parsed via YAML parameters:
- `API_KEY`: The hashed security token required inside the request header block to authorize inbound packets.
- `XUI_ADDRESS`: The full destination URL endpoint of the target managed MHSanaei X-UI instance.
- `INBOUNDS`: An array of explicit integer IDs representing the panel inbounds tracked by the synchronization loop.

### Database Architecture
This application utilizes an embedded **SQLite** database instance engine to persist client states, tracking historical bandwidth expiration markers and depleted flags. 
- **Automated Initialization**: The database schema initializes automatically on the initial bootstrap execution block. No manual migration runs or external SQL imports are required.
- **API Key Generation**: Running the initial startup script `./start.sh` automatically prints the plaintext access key to the terminal output while securely writing the corresponding hash to your `config.yaml`. *Note: Ensure you record the plaintext hex key from the console dump; the application only handles authentication validations using the plaintext string inside the header key.*

## API Documentation

**Authentication**:
All API endpoints require the `API_KEY` header.

- **Header Key**: `API_KEY`
- **Value**: Your plaintext API Key (the hex key printed when generating the key, or returned from `GET /api/newApiKey`. *Note: Do not use the hash stored in `config.yaml`*).

### System

#### `GET /api/system/reload`

Reloads the database and configuration settings without restarting the Node.js process.

- **Response**:
  ```json
  {
    "ok": true,
    "msg": "reloaded successfully"
  }
  ```

#### `GET /api/system/new-api-key`

Generates a new API key for the application and updates its hash in `config.yaml`.

- **Response**:
  ```json
  {
    "ok": true,
    "msg": "Created a new API Key.",
    "apiKey": "your_new_plaintext_api_key_here"
  }
  ```

#### `POST /api/system/panel-address`

Updates the X-UI panel address in the configuration.

- **Body**:
  ```json
  {
    "newAddress": "http://127.0.0.1:54321"
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "X-UI panel address updated successfully."
  }
  ```

#### `POST /api/system/panel-inbounds`

Updates the configured Inbound IDs.

- **Body**:
  ```json
  {
    "newInbounds": [1, 2, 3]
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "X-UI panel inbounds updated successfully."
  }
  ```

#### `GET /api/system/restart-xray`

Triggers a restart of the X-Ray core on the connected X-UI server.

- **Response**:
  ```json
  {
    "ok": true,
    "msg": "xray core restarted successfully"
  }
  ```

### Synchronization

#### `GET /apisync/start`

Starts the background clients traffic usage synchronization process.

- **Query Params**:
  - `timer`: (Optional) Interval in seconds for synchronization (default: 30).
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "Clients status checking started."
  }
  ```

#### `GET /api/sync/stop`

Stops the client synchronization process.

- **Response**:
  ```json
  {
    "ok": true,
    "msg": "Clients status checking stopped."
  }
  ```

### Client Management

#### `POST /api/client`

Adds a new client to X-UI.

- **Body**:
  ```json
  {
    "client": {
      "id": "uuid-string-here",
      "email": "user@example.com",
      "limitIp": 2,
      "totalGB": 107374182400,
      "expiryTime": 1717977600000,
      "enable": true,
      "tgId": "123456789",
      "subId": "unique-sub-id",
      "inbound": 1
    }
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "new client added to x-ui panel"
  }
  ```

#### `PUT /api/client`

Updates an existing client in X-UI.

- **Body**:
  ```json
  {
    "client": {
      "id": "uuid-string-here",
      "email": "user@example.com",
      "limitIp": 2,
      "totalGB": 107374182400,
      "expiryTime": 1717977600000,
      "enable": true,
      "tgId": "123456789",
      "subId": "unique-sub-id",
      "inbound": 1
    }
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "Updated clients' stat: user@example.com - id: uuid-string-here"
  }
  ```

#### `DELETE /api/client`

Removes a client from X-UI.

- **Body**:
  ```json
  {
    "client": {
      "id": "uuid-string-here",
      "inbound": 1
    }
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "client deleted from x-ui panel"
  }
  ```

#### `GET /api/client/:subId`

Retrieves full aggregated information for a specific client by their Subscription ID.

- **Response**:
  ```json
  {
    "ok": true,
    "data": {
      "id": ["uuid-string-here"],
      "security": "auto",
      "email": ["user@example.com"],
      "limitIp": 2,
      "totalGB": 107374182400,
      "expiryTime": 1717977600000,
      "enable": true,
      "tgId": "123456789",
      "subId": "unique-sub-id",
      "reset": 0,
      "down": 1000000,
      "up": 2000000,
      "inbound": [1]
    }
  }
  ```

#### `GET /api/clients/all`

Retrieves a list of all clients and their full aggregated information.

- **Response**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": ["uuid-string-here"],
        "security": "auto",
        "email": ["user@example.com"],
        "limitIp": 2,
        "totalGB": 107374182400,
        "expiryTime": 1717977600000,
        "enable": true,
        "tgId": "123456789",
        "subId": "unique-sub-id",
        "reset": 0,
        "down": 1000000,
        "up": 2000000,
        "inbound": [1]
      }
    ]
  }
  ```

### Client Lookup Hooks

#### `POST /api/clients/usage`

Modifies a client's usage statistics (sets usage on the database).

- **Body**:
  ```json
  {
    "client": {
      "email": "user@example.com",
      "usage": 1000000000
    }
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "client usage has updated"
  }
  ```

#### `GET /api/clients/sub-ids`

Retrieves a list of all client Subscription IDs.

- **Response**:
  ```json
  {
    "ok": true,
    "data": [
      "unique-sub-id-1",
      "unique-sub-id-2"
    ]
  }
  ```

#### `GET /api/clients/sid-by-id/:id`

Retrieves a client's Subscription ID using their UUID.

- **Response**:
  ```json
  {
    "ok": true,
    "data": "unique-sub-id"
  }
  ```

#### `GET /api/clients/sid-by-email/:email`

Retrieves a client's Subscription ID using their email address.

- **Response**:
  ```json
  {
    "ok": true,
    "data": "unique-sub-id"
  }
  ```

### Usage & Depletion

#### `GET /api/clients/depleted`

Retrieves a list of clients that are flagged as depleted (overused traffic or outdated time limit).

- **Response**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "client_name": "unique-sub-id",
        "timestamp": 1717977600000
      }
    ]
  }
  ```

#### `POST /api/clients/depleted-flag`

Manually sets or unsets the depleted status for a client.

- **Body**:
  ```json
  {
    "data": {
      "subId": "client_sub_id_string",
      "isDepleted": true
    }
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "msg": "client_sub_id_string depleted flag was set to true."
  }
  ```

### Object Schemas

#### **Aggregated Client Profile** (GET Responses)
Returned by `/api/getClient/:subId` and `/api/getAllClients`. This profile groups a client's details and traffic usage across all configured inbounds.

```typescript
interface Client {
  id: string[];            // Array of client UUID strings across inbounds
  security: "auto" | string;
  email: string[];         // Array of client email strings across inbounds
  limitIp: number;
  totalGB: number;
  expiryTime: number;      // Expiration timestamp (epoch in milliseconds)
  enable: boolean;
  tgId: string;
  subId: string;
  reset: number;
  down: number;            // Total downloaded bytes across inbounds
  up: number;              // Total uploaded bytes across inbounds
  inbound: number[];       // Array of Inbound IDs this client is configured on
}
```

#### **Single Client Input** (POST Requests)
Required in the request body for `/api/addClient` and `/api/updateClient`.

```typescript
interface SingleClientInput {
  id: string;              // Client UUID string
  email: string;
  limitIp: number;
  totalGB: number;
  expiryTime: number;      // Expiration timestamp (epoch in milliseconds, 0 for unlimited)
  enable: boolean;
  tgId: string;
  subId: string;
  inbound: number;         // Inbound ID (integer)
}
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
