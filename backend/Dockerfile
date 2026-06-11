FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./

RUN npm install --build-from-source

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]