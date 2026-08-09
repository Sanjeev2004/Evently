FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci
COPY backend ./backend
RUN npm run prisma:generate -w backend && npm run build -w backend
FROM node:22-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
EXPOSE 4000
CMD ["node","dist/src/server.js"]
