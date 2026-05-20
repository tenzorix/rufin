# Стейдж сборки
FROM node:22-alpine AS builder

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходники и собираем
COPY . .
RUN npm run build

# Стейдж прод‑сервера (nginx)
FROM nginx:1.27-alpine

# Копируем собранный фронт в стандартную директорию nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# (опционально) свой nginx.conf можно смонтировать или скопировать, если нужен SPA fallback

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]