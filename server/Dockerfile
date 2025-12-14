FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

EXPOSE 4000

CMD ["node", "server.js"]



