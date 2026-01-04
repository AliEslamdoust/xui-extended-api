FROM node:24.12.0-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ build-essential

COPY package*.json ./
RUN npm install
COPY . .

RUN chmod +x start.sh
CMD ["sh", "start.sh"]