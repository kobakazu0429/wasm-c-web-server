"use strict";

import express from "express";
import cors from "cors";
import compile from "./routes/compile.mjs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/compile", compile);

const port = 3001;
app.listen(port, () => {
  console.log(`server start, port is ${port}`);
});
