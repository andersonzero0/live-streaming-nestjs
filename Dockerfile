FROM node:20-alpine AS builder
ENV NODE_ENV=build
WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build \
    && npm prune --production

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist/ ./dist/
RUN npm install --production
CMD ["node", "dist/main.js"]