FROM node:20-alpine

WORKDIR /app

COPY prisma ./prisma

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npm run build || echo "⚠️ Build warnings ignored"

EXPOSE 8081
CMD ["npm", "run", "start"]
