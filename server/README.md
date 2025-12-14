Farmer Network API

Environment

Create a .env file in server/ with:

MONGO_URI=mongodb://localhost:27017/farmer_network
PORT=4000
JWT_SECRET=change_me
OPENWEATHER_KEY=

Run locally

cd server
npm install
npm run start

API will be available at http://localhost:4000

Run with Docker Compose

# from repo root
"docker compose up -d --build"

Services

- MongoDB: mongodb://localhost:27017
- API: http://localhost:4000

Endpoints

- POST /api/users/register
- POST /api/users/login
- GET /api/posts | POST /api/posts
- GET /api/comments/:postId | POST /api/comments
- POST /api/messages | GET /api/messages/inbox/:userId
- GET /api/weather/hourly?lat=..&lon=..

Notes

- CORS is enabled; adjust as needed in server.js
- Uploads are stored under /uploads and served statically

