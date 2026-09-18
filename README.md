# TPL2026 – T10 Cricket League

A complete full-stack cricket tournament management platform with live auction, player registration, team management, and real-time bidding.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, TypeScript, SCSS |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO (WebSocket) |
| Data Storage | Excel (xlsx library) – `server/data/tpl2026.xlsx` |
| Auth | JWT (jsonwebtoken + bcryptjs) |

## Project Structure

```
cpl/                        ← Angular frontend
  src/app/
    pages/                  ← All page components
    services/               ← API, Socket, Auth, Toast services
    components/             ← Shared components (navbar, footer, toast, modal)
    types/                  ← TypeScript interfaces

server/                     ← Node.js backend
  index.js                  ← Express server + REST APIs + Socket.IO
  excel.service.js          ← Thread-safe Excel read/write service
  auction.engine.js         ← Auction state machine + timer
  data/tpl2026.xlsx         ← Auto-created on first run
  uploads/                  ← Player/team photo uploads
```

## Setup & Run

### 1. Start the Backend

```bash
cd server
npm install
node index.js
# Server runs on http://localhost:3000
```

### 2. Start the Frontend

```bash
# In project root (d:\tpl\cpl)
npm install
ng serve
# App runs on http://localhost:4200
```

## Admin Login

- URL: `http://localhost:4200/login`
- Username: `admin`
- Password: `tpl2026admin`

## Team Owner Login

- URL: `http://localhost:4200/login` → Team Owner tab
- Team ID: e.g. `TPL26-T01`
- Password: Owner's contact number (set when team is created)

## Excel File

Location: `server/data/tpl2026.xlsx`

Sheets:
- **Players** – All player registrations
- **Teams** – Registered teams with purse
- **Auction** – Auction history per player
- **Bids** – All individual bids
- **Announcements** – Ticker announcements
- **Settings** – Configurable tournament settings
- **AuditLog** – Admin action history

The Excel file is auto-created with default settings on first run.

## Auction Flow

1. Admin logs in → `/admin/auction`
2. Click **Random Player** or **Select Player**
3. Click **Start Auction** → state becomes LIVE
4. Team owners bid via `/auction` page
5. All users see real-time bid updates via WebSocket
6. Timer counts down (default 20s), resets on each bid
7. Timer expires → highest bidder wins → **SOLD**
8. No bids → **UNSOLD**
9. Team purse auto-deducted, player status updated in Excel
10. Repeat for next player

## WebSocket Events

| Event | Description |
|-------|-------------|
| `AUCTION_STARTED` | Auction went live |
| `PLAYER_SELECTED` | Admin selected a player |
| `BID_PLACED` | New bid received |
| `TIMER_UPDATED` | Countdown tick |
| `PLAYER_SOLD` | Player sold with final bid |
| `PLAYER_UNSOLD` | Player unsold |
| `TEAM_PURSE_UPDATED` | Team purse changed |
| `ANNOUNCEMENT_UPDATED` | New announcement |

## Configuration (Admin Settings)

| Setting | Default | Description |
|---------|---------|-------------|
| initialPurse | ₹21,000 | Starting purse per team |
| baseBid | ₹100 | Minimum starting bid |
| bidIncrement | ₹100 | Minimum bid step |
| auctionTimer | 20s | Timer per player |
| maxTeams | 5 | Maximum teams allowed |
| tournamentDate | TBA | Display on homepage |
| tournamentVenue | TBA | Display on tournament page |

## Access Control

| Feature | Public | Team Owner | Admin |
|---------|--------|-----------|-------|
| View Players/Teams | ✅ | ✅ | ✅ |
| Register Player | ✅ | ✅ | ✅ |
| Edit/Delete Player | ❌ | ❌ | ✅ |
| Add Team | ❌ | ❌ | ✅ |
| View Auction | ✅ | ✅ | ✅ |
| Place Bid | ❌ | ✅ | ❌ |
| Auction Controls | ❌ | ❌ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |

## Production Deployment

1. Build Angular: `ng build --configuration production`
2. Serve `dist/cpl` via nginx or Express static
3. Set environment variables:
   - `JWT_SECRET` – strong random secret
   - `ADMIN_PASS` – secure admin password
   - `PORT` – server port (default 3000)
4. Use PM2 for Node.js process management: `pm2 start server/index.js`
