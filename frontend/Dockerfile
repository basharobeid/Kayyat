# Development image (hot reload via the compose volume mount).
# For production, add a multi-stage build that runs `next build` and serves .next/standalone.
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
