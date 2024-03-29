import path from "node:path";
import fs from "node:fs/promises";
import url from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { ulid } from "ulid";

const pExec = promisify(exec);

const CLANG_PATH = process.env.WASI_SDK;
const WASM_OPT_PATH = process.env.WASM_OPT;

if (!CLANG_PATH) throw new Error("CLANG_PATH not set");
if (!WASM_OPT_PATH) throw new Error("WASM_OPT_PATH not set");

import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.send("compile api, return wasm binary when post code");
});

const CODE = {
  OK: 0,
  ERROR: 10,
  UNKNOWN: 90,
};

router.post("/", async (req, res) => {
  const { src } = req.body;
  try {
    const binary = await compileToWasm(src).catch((e) => {
      throw e;
    });
    res.json({
      code: CODE.OK,
      binary,
    });
  } catch (error: any) {
    console.log(error);
    const message = error.stderr
      .trim()
      .replaceAll(
        "/Users/kazu/ghq/github.com/kobakazu0429/wasm-c-web-server/.tmp/",
        ""
      )
      .replaceAll(/[0-9A-Z]{26}\.c/g, "main.c");

    console.log(message);

    res.json({
      code: CODE.ERROR,
      message,
    });
  }
});

const compileToWasm = async (src: string) => {
  const id = ulid();
  const rawFileName = `${id}.c`;
  const wasmFileName = `${id}.wasm`;
  const asyncWasmFileName = `${id}.async.wasm`;

  const dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const tmp = path.join(dirname, "..", "..", ".tmp");

  const rawFilePath = path.resolve(path.join(tmp, rawFileName));
  const wasmFilePath = path.resolve(path.join(tmp, wasmFileName));
  const asyncWasmFilePath = path.resolve(path.join(tmp, asyncWasmFileName));

  await fs.writeFile(rawFilePath, src);

  await pExec(
    [
      `${CLANG_PATH}/bin/clang`,
      `--sysroot=${CLANG_PATH}/share/wasi-sysroot`,

      // The file size is generally 1.3 to almost 2 times larger.
      "-Wl,--export-all",
      rawFilePath,
      `-o`,
      wasmFilePath,
    ].join(" ")
  );

  await pExec(
    `${WASM_OPT_PATH} --asyncify ${wasmFilePath} -o ${asyncWasmFilePath}`
  );

  return await fs.readFile(asyncWasmFilePath);
};

export default router;
