# Use official Node image for build
FROM node:20-slim AS builder
WORKDIR /app

# Declare build args so docker-compose can pass them in
ARG VITE_API_BASE_URL
ARG VITE_SAAS_PLATFORM_URL

# Make them available to the Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SAAS_PLATFORM_URL=$VITE_SAAS_PLATFORM_URL

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Use official Nginx image for serving static files
FROM nginx:alpine AS runner

# Prepare directories writable by non-root nginx user
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
