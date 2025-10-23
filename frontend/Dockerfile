FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Копируем только нужные файлы
COPY public ./public
COPY src ./src

# Сборка
RUN npm run build

# Запуск сервера
RUN npm install -g serve
CMD ["serve", "-s", "build"]

EXPOSE 3000
