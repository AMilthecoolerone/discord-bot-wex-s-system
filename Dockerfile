# Minimal Dockerfile (optional)
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i --only=prod
COPY . .
CMD ["node", "src/index.js"]
