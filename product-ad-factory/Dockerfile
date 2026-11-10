# Backend only: Remotion rendering runs separately in GitHub Actions.
FROM node:22-bookworm AS dependencies
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3100
ENV DATA_DIR=/data
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./package.json
COPY app/ ./app/
COPY website/ ./website/
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3100
CMD ["node","app/server.mjs"]
