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

# wasm-opt
WORKDIR /opt
RUN wget https://github.com/WebAssembly/binaryen/releases/download/version_101/binaryen-version_101-x86_64-linux.tar.gz
RUN tar xvzf binaryen-version_101-x86_64-linux.tar.gz
ENV PATH /opt/binaryen-version_101/bin:$PATH
ENV WASM_OPT /opt/binaryen-version_101/bin/wasm-opt

# clangd (for LSP)
RUN apt install -y lsb-release software-properties-common gnupg
RUN bash -c "$(wget -O - https://apt.llvm.org/llvm.sh)"
RUN apt install -y clangd-13
# clang-format-13
ENV CLANGD /usr/bin/clangd-13

WORKDIR $APP_ROOT
CMD [ "yarn", "start" ]
