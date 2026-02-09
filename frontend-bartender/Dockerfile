# Frontend Bartender Dockerfile for Development (Optimized)
FROM node:18-alpine

WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json* ./

# Use npm ci for faster, cleaner installs
# If package-lock.json doesn't exist, fall back to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
