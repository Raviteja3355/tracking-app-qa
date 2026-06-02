FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

FROM nginx:alpine

# 1. Update and Upgrade packages
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache ca-certificates tzdata && \
    rm -rf /var/cache/apk/*

# 2. Setup Nginx directories
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp

# 3. Copy files
COPY --from=builder --chown=nginx:nginx /app/out /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# 4. Permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html /etc/nginx/conf.d /var/run/nginx.pid && \
    chmod -R 755 /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
