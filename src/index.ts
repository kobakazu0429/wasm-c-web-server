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

const port = 3001;
const server = app.listen(port, () => {
  console.log(`server start, port is ${port}`);
});

server.on("upgrade", lspUpgrader);
