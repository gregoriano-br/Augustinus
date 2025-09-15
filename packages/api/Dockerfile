# Use a Node.js base image (Bun can run Node.js applications)
FROM oven/bun:latest

# Set the working directory to /app
WORKDIR /app

# Copy the entire project
COPY . .

# Install all dependencies for the monorepo
RUN bun install

# Change to the API directory
WORKDIR /app/packages/api

# Expose the port the API runs on (assuming default 3000)
EXPOSE 3000

# Command to run the API
CMD ["bun", "run", "start"]
