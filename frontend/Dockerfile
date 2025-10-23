FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything at once
COPY . .

# Install dependencies
RUN npm install

# Debug: Check what files are copied
RUN ls -la /app
RUN ls -la /app/public || echo "public directory not found"

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
