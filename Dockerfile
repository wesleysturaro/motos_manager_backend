FROM node:20-alpine AS runner
WORKDIR /app
ENV CI=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

RUN mkdir -p uploads
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/src/main"]
