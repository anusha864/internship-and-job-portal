FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./

# IMPORTANT FIX
RUN npm install --build-from-source sqlite3

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]