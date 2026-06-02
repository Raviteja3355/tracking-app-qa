FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM nginx:1.28-alpine

RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache --upgrade nginx ca-certificates tzdata && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp

COPY --from=builder --chown=nginx:nginx /app/out /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx \
    /var/cache/nginx \
    /var/log/nginx \
    /usr/share/nginx/html \
    /etc/nginx/conf.d && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /etc/nginx/conf.d/default.conf && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid && \
    chmod 644 /var/run/nginx.pid

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
