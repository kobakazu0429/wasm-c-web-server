FROM node:16.9.1-slim
ENV APP_ROOT /app/

WORKDIR $APP_ROOT

COPY package.json yarn.lock $APP_ROOT
RUN yarn install

COPY . $APP_ROOT

# wasi-sdk
WORKDIR /opt
RUN apt update
RUN apt install -y wget cmake git autoconf automake autotools-dev libtool binaryen

RUN wget --no-check-certificate https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/wasi-sdk-12.0-linux.tar.gz
RUN tar xvzf wasi-sdk-12.0-linux.tar.gz
ENV PATH /opt/wasi-sdk-12.0/bin:$PATH

ENV WASI_SDK /opt/wasi-sdk-12.0/

WORKDIR $APP_ROOT
CMD [ "yarn", "start" ]
