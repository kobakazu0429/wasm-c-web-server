cp /etc/letsencrypt/live/wasm-c-web-server.kaz.dev/privkey.pem ./
cp /etc/letsencrypt/live/wasm-c-web-server.kaz.dev/fullchain.pem ./

chown ubuntu:ubuntu privkey.pem
chown ubuntu:ubuntu fullchain.pem
