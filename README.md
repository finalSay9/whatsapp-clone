# whatsapp-clone
#Real-time messaging between two users over WebSocket with Redis pub/sub in the #middle. That is genuinely impressive work.
```mermaid
flowchart TD
    Client["Client Apps (Web / Mobile)"]

    Gateway["API Gateway"]

    Auth["Auth Service"]
    Users["Users Service"]
    Chat["Chat Service"]
    Messages["Messages Service"]
    Notif["Notifications Service"]
    Presence["Presence Service"]

    DB1[("PostgreSQL - Auth")]
    DB2[("PostgreSQL - Users")]
    DB3[("PostgreSQL - Chat")]
    DB4[("PostgreSQL - Messages")]
    DB5[("PostgreSQL - Notifications")]

    Redis[("Redis")]

    Client -->|HTTP / WS| Gateway

    Gateway --> Auth
    Gateway --> Users
    Gateway --> Chat
    Gateway --> Messages

    Auth --> DB1
    Users --> DB2
    Chat --> DB3
    Messages --> DB4
    Notif --> DB5

    Messages -->|Publish Events| Redis
    Chat -->|Publish Events| Redis

    Redis --> Notif
    Redis --> Presence
    Redis --> Gateway

    Presence --> Redis
```

PROJECT STRUCTURE

 ```mermaid
 flowchart TD
    Root[whatsapp-clone]

    Apps[apps]
    Libs[libs]

    Root --> Apps
    Root --> Libs

    Apps --> Gateway
    Apps --> Auth
    Apps --> Users
    Apps --> Chat
    Apps --> Messages
    Apps --> Notifications
    Apps --> Presence

    Libs --> Common
    Libs --> Database
    Libs --> Redis
```

DATABASE STRATEGY

```mermaid
flowchart TD
    Auth --> DB1[(Auth DB)]
    Users --> DB2[(Users DB)]
    Chat --> DB3[(Chat DB)]
    Messages --> DB4[(Messages DB)]
    Notifications --> DB5[(Notifications DB)]

    Presence --> Redis[(Redis Only)]
```
COMMUNICATION PATTERN

```mermaid
flowchart TD
    Client["Client Apps"]

    Gateway["API Gateway"]

    Auth["Auth"]
    Users["Users"]
    Chat["Chat"]
    Messages["Messages"]
    Notifications["Notifications"]
    Presence["Presence"]

    DB1[("Auth DB")]
    DB2[("Users DB")]
    DB3[("Chat DB")]
    DB4[("Messages DB")]
    DB5[("Notifications DB")]
    Redis[("Redis")]

    Client --> Gateway

    Gateway --> Auth
    Gateway --> Users
    Gateway --> Chat
    Gateway --> Messages

    Auth --> DB1
    Users --> DB2
    Chat --> DB3
    Messages --> DB4
    Notifications --> DB5

    Messages --> Redis
    Chat --> Redis

    Redis --> Notifications
    Redis --> Presence
    Redis --> Gateway

    %% Styles
    classDef gateway stroke:#fb923c,fill:#fff7ed,color:#1e1b4b
    classDef service stroke:#818cf8,fill:#eef2ff,color:#1e1b4b
    classDef async stroke:#2dd4bf,fill:#f0fdfa,color:#1e1b4b
    classDef db stroke:#94a3b8,fill:#f8fafc,color:#1e1b4b

    class Gateway gateway
    class Auth,Users,Chat,Messages service
    class Notifications,Presence async
    class DB1,DB2,DB3,DB4,DB5,Redis db
```mermaid
flowchart TD
    Client["Client Apps"]

    Gateway["API Gateway"]

    Auth["Auth"]
    Users["Users"]
    Chat["Chat"]
    Messages["Messages"]
    Notifications["Notifications"]
    Presence["Presence"]

    DB1[("Auth DB")]
    DB2[("Users DB")]
    DB3[("Chat DB")]
    DB4[("Messages DB")]
    DB5[("Notifications DB")]
    Redis[("Redis")]

    Client --> Gateway

    Gateway --> Auth
    Gateway --> Users
    Gateway --> Chat
    Gateway --> Messages

    Auth --> DB1
    Users --> DB2
    Chat --> DB3
    Messages --> DB4
    Notifications --> DB5

    Messages --> Redis
    Chat --> Redis

    Redis --> Notifications
    Redis --> Presence
    Redis --> Gateway

    %% Styles
    classDef gateway stroke:#fb923c,fill:#fff7ed,color:#1e1b4b
    classDef service stroke:#818cf8,fill:#eef2ff,color:#1e1b4b
    classDef async stroke:#2dd4bf,fill:#f0fdfa,color:#1e1b4b
    classDef db stroke:#94a3b8,fill:#f8fafc,color:#1e1b4b

    class Gateway gateway
    class Auth,Users,Chat,Messages service
    class Notifications,Presence async
    class DB1,DB2,DB3,DB4,DB5,Redis db
```
```

REAL-TIME MESSAGE FLOW

```mermaid
sequenceDiagram
    participant ClientA
    participant Gateway
    participant Messages
    participant Redis
    participant Notifications
    participant Presence
    participant ClientB

    ClientA->>Gateway: Send message (WebSocket)
    Gateway->>Messages: Forward (TCP)

    Messages->>Messages: Save to DB
    Messages->>Redis: Publish "new_message"

    Redis-->>Notifications: Event
    Redis-->>Presence: Event
    Redis-->>Gateway: Event

    Notifications->>ClientB: Push notification (if offline)
    Presence->>Presence: Update last seen

    Gateway->>ClientB: Deliver message (WebSocket)
```
