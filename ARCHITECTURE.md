# System Architecture

## 1. Indexer Mechanism

The **Indexer** is a standalone Node.js service responsible for syncing on-chain data to a local PostgreSQL database. It operates by polling the Sui network for events emitted by the `VaniHash` and `Marketplace` packages.

### Indexer Logic Flow

```mermaid
graph TD
    Start[Start Indexer] --> Init[Init Services & DB]
    Init --> GetCursor[Get Last Cursor from DB]
    GetCursor --> PollLoop{Poll Loop}
    
    PollLoop -->|Query Events| SuiNode[Sui Fullnode]
    SuiNode -->|Events Data| Parse[Parse Events]
    
    Parse -->|Extract Task/Listing| Process[Process Data]
    Process -->|Upsert| DB[(Postgres DB)]
    
    Process --> UpdateCursor[Update Cursor in DB]
    UpdateCursor --> Sleep[Sleep / Wait]
    Sleep --> PollLoop
```

### Data Flow Components

- **SuiService**: Wrapper around SuiClient to query events with pagination.
- **EventParser**: Deserializes raw event JSON into structured data.
- **DbService**: Prisma-based service to update `Task` and `Listing` tables.

---

## 2. Web Application Logic

The **Web App** is a Next.js application that serves as the user interface. It interacts with both the Indexer (via API) for reading data and the Sui Blockchain (via Wallet) for writing data (transactions).

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Web[Next.js App]
    participant API[Internal API /api/*]
    participant DB[(Postgres DB)]
    participant Wallet[Sui Wallet]
    participant Chain[Sui Blockchain]

    Note over Web, DB: READ Path
    Web->>API: GET /api/tasks (Fetch Tasks)
    API->>DB: Prisma Query
    DB-->>API: Task Data
    API-->>Web: JSON Response
    Web-->>User: Render Task List

    Note over Web, Chain: WRITE Path (e.g. Create Task)
    User->>Web: Click "Create Task"
    Web->>Wallet: Request Transaction Approval
    Wallet-->>User: Sign Request
    User->>Wallet: Approve
    Wallet->>Chain: Execute Move Call (create_task)
    Chain-->>Web: Transaction Success
    Web->>User: Show Success Toast
```

### Task Lifecycle State Machine

The lifecycle of a Task involves interactions between the Creator, the Miner, and the System (time).

```mermaid
stateDiagram-v2
    [*] --> GracePeriod: Created (TimeStamp T)
    
    state GracePeriod {
        [*] --> Pending
        Pending --> Cancelled: Creator Cancels
    }

    GracePeriod --> Active: T + 15 mins
    
    state Active {
        [*] --> Open
        Open --> Completed: Miner Submits Proof
        Open --> Expired: T + Lock Duration
    }

    Cancelled --> [*]
    Completed --> [*]
    Expired --> [*]
```
