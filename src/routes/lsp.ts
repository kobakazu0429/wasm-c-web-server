import type { IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { WebSocketServer } from "ws";
import * as rpc from "vscode-ws-jsonrpc";
import * as server from "vscode-ws-jsonrpc/server";
import * as lsp from "vscode-languageserver";

const CLANGD = process.env.CLANGD;
if (!CLANGD) throw new Error("CLANGD not set");

const wss = new WebSocketServer({
  noServer: true,
  perMessageDeflate: false,
});

export const upgrader = (
  request: IncomingMessage,
  socket: Socket,
  head: Buffer
) => {
  if (request.url === "/lsp") {
    wss.handleUpgrade(request, socket, head, (webSocket) => {
      const socket: rpc.IWebSocket = {
        send: (content) =>
          webSocket.send(content, (error) => {
            if (error) {
              throw error;
            }
          }),
        onMessage: (cb) => webSocket.on("message", cb),
        onError: (cb) => webSocket.on("error", cb),
        onClose: (cb) => webSocket.on("close", cb),
        dispose: () => webSocket.close(),
      };
      // launch the server when the web socket is opened
      if (webSocket.readyState === webSocket.OPEN) {
        launch(socket);
      } else {
        webSocket.on("open", () => launch(socket));
      }
    });
  }
};

const launch = (socket: rpc.IWebSocket) => {
  const reader = new rpc.WebSocketMessageReader(socket);
  const writer = new rpc.WebSocketMessageWriter(socket);

  const socketConnection = server.createConnection(reader, writer, () =>
    socket.dispose()
  );

  const serverConnection = server.createServerProcess("c", CLANGD);
  if (!serverConnection) {
    throw new Error("serverConnection is undefined.");
  }

  server.forward(socketConnection, serverConnection, (message) => {
    if (lsp.Message.isRequest(message)) {
      if (message.method === lsp.InitializeRequest.type.method) {
        const initializeParams = message.params as lsp.InitializeParams;
        initializeParams.processId = process.pid;
      }
    }
    return message;
  });
};
