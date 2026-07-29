\# Reloop



A mobile marketplace for buying and selling secondhand clothes — think Vinted. Built as an 8-week learning project covering the full software lifecycle: planning, feature-by-feature development, git workflow, testing, and shipping a working demo.



\## Stack



\- \*\*Frontend:\*\* React Native (Expo, Expo Router)

\- \*\*Backend:\*\* FastAPI (Python)

\- \*\*Database:\*\* PostgreSQL



\## Features



\- Email/password signup and login (buyer or seller role)

\- Sellers can create a store and list items with photos

\- Home feed showing all listed items, with search

\- Item detail page with description, size, price, and seller's store link

\- Store page showing all items from one seller

\- Mock "Buy" flow — marks an item sold and records the buyer (no real payment)

\- Sellers can't buy their own listings

\- Seller dashboard — active/sold counts and total earnings

\- Profile screen showing account info



\## Project structure


\## Setup — Backend



1\. Install PostgreSQL locally and create a database:

```sql

&#x20;  CREATE DATABASE clothes\_marketplace;

```

&#x20;  Update the connection string in `backend/database.py` if your username/password differ from the default.



2\. Set up the Python environment:

```bash

&#x20;  cd backend

&#x20;  python -m venv venv

&#x20;  # Windows:

&#x20;  .\\venv\\Scripts\\Activate.ps1

&#x20;  # Mac/Linux:

&#x20;  source venv/bin/activate



&#x20;  pip install fastapi uvicorn sqlalchemy psycopg2-binary bcrypt python-multipart

```



3\. Run the server:

```bash

&#x20;  python -m uvicorn main:app --reload --host 0.0.0.0

```



&#x20;  \*\*Important:\*\* the `--host 0.0.0.0` flag is required — without it, the API only accepts connections from `localhost`, and your phone/Expo app won't be able to reach it over the network.



4\. Confirm it's running: open `http://localhost:8000/docs` — you should see the Swagger UI with all endpoints listed.



\## Setup — Frontend



1\. Install dependencies:

```bash

&#x20;  cd frontend

&#x20;  npm install

```



2\. \*\*Set your backend's IP address.\*\* Open `frontend/src/lib/api.ts` and update it to match your computer's current local network IP (not `localhost` — the phone/emulator needs your machine's actual LAN address):

```bash

&#x20;  # Find your IP:

&#x20;  ipconfig        # Windows — look for "IPv4 Address" under your active network adapter

&#x20;  ifconfig        # Mac/Linux

```

```typescript

&#x20;  export const API\_URL = "http://YOUR\_IP\_HERE:8000";

```

&#x20;  This changes every time you switch networks (home wifi, university wifi, hotspot) — if the app suddenly can't load data, this is the first thing to check.



3\. Start the app:

```bash

&#x20;  npx expo start

```

&#x20;  Scan the QR code with the \*\*Expo Go\*\* app on your phone, or press `w` to open in a browser.



&#x20;  If your phone can't connect over normal wifi (firewall or network isolation issues), try:

```bash

&#x20;  npx expo start --tunnel

```



\## Git workflow



Every feature was built on its own branch and merged into `main`:

```bash

git checkout -b feature/name

\# build, test, commit

git checkout main

git merge feature/name

git push origin main

```



\## Known issues / lessons learned



\- `passlib` (older password-hashing library) had a version incompatibility with newer `bcrypt` releases, causing signup to crash. Fixed by hashing passwords directly with `bcrypt` instead of going through `passlib`.

\- Hardcoding IP addresses across multiple files broke everything after switching development machines. Fixed by centralizing the backend URL into a single `frontend/src/lib/api.ts` file.

\- `uvicorn` must be run with `--host 0.0.0.0`, or devices on the same network (like a phone running Expo Go) can't reach it.



\## What's not included (by design)



\- Real payments — "buying" is mocked, just marks an item sold

\- OAuth/JWT — authentication is plain email + password, kept intentionally simple

\- Advanced filters (size/price range) exist on the backend API but aren't wired into the UI yet



\## Screenshots



\_Add screenshots here before final submission — home feed, item detail, seller dashboard, create-item flow.\_

