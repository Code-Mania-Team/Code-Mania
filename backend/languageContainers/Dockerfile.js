FROM node:20-alpine
WORKDIR /usr/src/app
COPY . .
CMD ["node", "main.js"]
