# Reloop

Reloop is a Vinted-style marketplace for buying and selling secondhand clothing. It is a full-stack learning project built with Expo, React Native, FastAPI, PostgreSQL, and Google Gemini.

## Features

- Email and password signup/login
- Seller stores and item listings
- Multiple photos per listing
- Search and listing filters
- Item condition, brand, colour, category, size, and price details
- Gemini-powered listing descriptions from a clothing photo
- Similar-item recommendations
- Buyer and seller messaging
- Offer acceptance and rejection
- Mock purchase flow
- Seller dashboard with active and sold listings
- Responsive web and mobile interfaces

## Tech stack

### Frontend

- React Native
- Expo
- Expo Router
- TypeScript

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Google Gen AI SDK
- bcrypt

## Project structure

```text
Ecommerce-project/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── ai_descriptions.py
│   ├── requirements.txt
│   └── tests/
└── frontend/
    ├── src/app/
    ├── src/components/
    ├── src/context/
    ├── src/lib/
    ├── assets/
    ├── app.json
    └── package.json
```

## Backend setup

### 1. Create the PostgreSQL database

Create a local PostgreSQL database named:

```sql
CREATE DATABASE clothes_marketplace;
```

### 2. Create a Python virtual environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### 3. Configure backend environment variables

Copy the example file:

```powershell
Copy-Item .env.example .env
```

Update the private `backend/.env` file:

```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clothes_marketplace

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
```

Create a Gemini API key through [Google AI Studio](https://aistudio.google.com/).

Never commit or share the real `.env` file, database password, or Gemini API key.

### 4. Start the backend

```powershell
python -m uvicorn main:app --reload
```

The API will run at `http://127.0.0.1:8000`.

Useful URLs:

- Health check: `http://127.0.0.1:8000/health`
- Swagger API documentation: `http://127.0.0.1:8000/docs`

For Expo Go on a physical phone, start the backend with:

```powershell
python -m uvicorn main:app --reload --host 0.0.0.0
```

## Frontend setup

### 1. Install dependencies

Open another terminal:

```powershell
cd frontend
npm install
```

### 2. Configure the API URL

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

For web development:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

For Expo Go on a physical phone, replace `localhost` with the computer's LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
```

The phone and computer must be connected to the same network.

### 3. Start the frontend

```powershell
npx expo start
```

Press `w` for the web app or scan the QR code with Expo Go.

## Gemini description generation

The listing form sends the cover photo and seller-provided item details to the backend. The backend calls Gemini and returns an editable description.

The Gemini key remains on the backend and is never sent to the browser or mobile app. Generated descriptions should still be reviewed by the seller before publishing.

Gemini free-tier usage is subject to Google's availability and rate limits.

## Testing

Run backend checks:

```powershell
cd backend
.\venv\Scripts\python.exe -m py_compile main.py database.py ai_descriptions.py
.\venv\Scripts\python.exe -m pytest tests -q
```

Run frontend checks:

```powershell
cd frontend
npx tsc --noEmit
npx expo export --platform web --output-dir dist
```

## Security notes

- Passwords are hashed with bcrypt.
- Database credentials and API keys are loaded from ignored environment files.
- New accounts receive a server-controlled internal role value.
- Real secrets must never be placed in `.env.example`, committed to Git, or shared in screenshots.

This remains a learning/demo application. It does not yet implement production authentication, authorization, sessions, JWTs, payment processing, cloud file storage, or database migrations.

## Known limitations

- Purchases and payments are simulated.
- Uploaded images are stored locally.
- API requests are not protected by production-grade authentication.
- Gemini availability depends on API quota and model availability.
- Database schema changes are currently managed manually.

## Git workflow

Development uses focused branches and pull requests:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/your-feature
```

After testing:

```powershell
git add <files>
git commit -m "Describe the change"
git push -u origin feature/your-feature
```

Create a pull request into `main`, review the changes, merge it, then synchronize and delete the completed branch.