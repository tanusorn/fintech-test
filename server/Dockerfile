FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# RUN npm install -g ts-node nodemon
# EXPOSE 8081
# CMD ["npm","run","start"]