Farmer Network API

Environment

Create a .env file in server/ with:

MONGODB_URI=mongodb://localhost:27017/farmer_network
PORT=4000
JWT_SECRET=your_secret_key_here_change_me
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

Authentication

The API uses JWT (JSON Web Tokens) for authentication. Users must register and login to access protected routes.

Registration:
- POST /api/auth/register
  - Body: { username, password, fullName? }
  - Returns: { message: "User created" }

Login:
- POST /api/auth/login
  - Body: { username, password }
  - Returns: { token, user: { username, fullName, avatarUrl } }

JWT Token Storage:
- The frontend stores the JWT token in localStorage under the key "token"
- All protected routes require the Authorization header: `Bearer <token>`
- Token expires after 1 day

Protected Routes:
All write operations (POST, PUT, DELETE) require authentication:
- POST /api/posts (create posts)
- POST /api/resources (add resources)
- POST /api/messages (send messages)
- POST /api/messages/conversations/:id/messages (send message to user)
- GET /api/messages/conversations (get user's conversations)
- GET /api/messages/conversations/:id (get messages with user)

Public Routes:
- GET /api/posts (view all posts)
- GET /api/resources (view all resources)

Endpoints

Authentication:
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login and get JWT token

Posts:
- GET /api/posts - Get all posts (public)
- POST /api/posts - Create a post (protected, requires JWT)

Resources:
- GET /api/resources - Get all resources (public)
- POST /api/resources - Add a resource (protected, requires JWT)

Messages:
- POST /api/messages - Send a message (protected)
- GET /api/messages/inbox/:userId - Get user's inbox (protected)
- GET /api/messages/conversations - Get all conversations for current user (protected)
- GET /api/messages/conversations/:otherUserId - Get messages with a user (protected)
- POST /api/messages/conversations/:otherUserId/messages - Send message to user (protected)

Other:
- GET /api/comments/:postId | POST /api/comments
- GET /api/weather/hourly?lat=..&lon=..

Notes

- CORS is enabled; adjust as needed in server.js
- Uploads are stored under /uploads and served statically

