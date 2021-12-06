import fs from "fs";
import https from "https";
import type http from "http";
import express from "express";
import cors from "cors";
import compile from "./routes/compile";
import { upgrader as lspUpgrader } from "./routes/lsp";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception: ", err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/compile", compile);

const port = parseInt(process.env.PORT!, 10);

let server: https.Server | http.Server;
if (process.env.NODE_ENV === "production") {
  const options = {
    key: fs.readFileSync("privkey.pem"),
    cert: fs.readFileSync("fullchain.pem"),
  };
  server = https.createServer(options, app).listen(port, () => {
    console.log(`server start, port is ${port}`);
  });
} else {
  server = app.listen(port, () => {
    console.log(`server start, port is ${port}`);
  });
}

server.on("upgrade", lspUpgrader);
