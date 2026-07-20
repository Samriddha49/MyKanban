# NOTE: Vite bakes VITE_* env vars into the static bundle at BUILD time, not at
# container run time. Pass VITE_API_BASE_URL as a build ARG if you need a
# non-default API URL, e.g.:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api .

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8080/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
