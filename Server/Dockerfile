# Use a Node.js base image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --omit=dev --no-audit --no-fund

# Copy the application source code
COPY . .

# Expose the application port
EXPOSE 3000

# Set the default command to run the application
CMD ["node", "src/index.js"]
