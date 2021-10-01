FROM node:16.9.1-slim
ENV APP_ROOT /app/

WORKDIR $APP_ROOT

COPY package.json yarn.lock $APP_ROOT
RUN yarn install

COPY . $APP_ROOT
