# build & preview ใน image เดียว
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm i
COPY . .
RUN npm run build
EXPOSE 3000
# IMPORTANT: ต้องมี --host ให้ bind 0.0.0.0 ใน container
CMD ["sh","-lc","npm run preview -- --host --port 3000"]
