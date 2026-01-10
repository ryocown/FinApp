# Use official Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy packages
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Install dependencies (from root to handle workspaces)
RUN npm ci

# Build shared package (if necessary) and server
# Assuming shared has a build script or is TS requiring compilation
WORKDIR /app/packages/shared
RUN npm run build --if-present

# Build server
WORKDIR /app/packages/server
# We need to ensure dependencies are linked correctly. 
# Since we did npm ci at root, node_modules are at /app/node_modules
# Server runs with tsx in dev, but for prod we might want to compile or just run tsx if simple.
# Package.json says "main": "index.js", but script "dev" uses "src/index.ts".
# Let's assume we run with tsx for simplicity in this Node 20 env, or we can compile tsc.
# Given there is a tsconfig, let's try to build. If build fails, we fallback to tsx.
# Adding a explicit build step for safety if it exists, otherwise relying on pre-installed tools.
RUN npm run build --if-present

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
