# ---- [Company] Security — production image (Koyeb / any container host) ----
# One process serves the API and the static website.
FROM node:20-slim

WORKDIR /app

# Install backend dependencies first (better layer caching).
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund

# Copy the rest of the repo (static site + backend source).
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run from backend/ so server.js resolves the website root as ".."
WORKDIR /app/backend
CMD ["npm", "start"]
