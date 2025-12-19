# Single stage for development
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build removido para DEV -> Ganhamos tempo de startup

# Expose the application port
EXPOSE 3000

# Use the dev script from package.json
CMD ["npm", "run", "dev"]