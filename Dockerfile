# Stage 1 — build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — serve
FROM nginx:1.28-alpine
RUN apk upgrade --no-cache
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Allow non-root nginx user (uid 101) to write pid and cache files
RUN chown -R nginx:nginx \
    /var/cache/nginx \
    /var/log/nginx \
    /usr/share/nginx/html \
    /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
