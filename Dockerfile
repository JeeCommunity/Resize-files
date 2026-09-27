FROM node:20-slim

# Install Ghostscript for PDF compression
RUN apt-get update && apt-get install -y ghostscript && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy all project source code
COPY . .

# Build Vite frontend (creates dist folder)
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start Express server which serves both API and frontend dist
CMD ["npm", "start"]
