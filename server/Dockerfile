FROM node:20-alpine

WORKDIR /app


COPY package*.json ./
RUN npm install


COPY . .


RUN npx prisma generate


RUN npm run build || echo 


EXPOSE 8081


CMD ["npm", "run", "start"]
