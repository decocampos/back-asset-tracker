FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# ADICIONADO: Build necessário para produção (gera a pasta dist)
# Isso faz o app gastar muito menos memória RAM
RUN npm run build

# Expose the application port
EXPOSE 3000

# ALTERADO: Usa o comando de produção definido no package.json
CMD ["npm", "start"]