import type { IncomingMessage } from "http";
import type { Socket } from "net";
import ws from "ws";
import * as rpc from "@codingame/monaco-jsonrpc";
import * as server from "@codingame/monaco-jsonrpc/lib/server/index.js";
import * as lsp from "vscode-languageserver";

const CLANGD = process.env.CLANGD;
if (!CLANGD) throw new Error("CLANGD not set");

const wss = new ws.Server({
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
      const socket = {
        send: (content: any) =>
          webSocket.send(content, (error) => {
            if (error) {
              throw error;
            }
          }),
        onMessage: (cb: any) => webSocket.on("message", cb),
        onError: (cb: any) => webSocket.on("error", cb),
        onClose: (cb: any) => webSocket.on("close", cb),
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
  server.forward(socketConnection, serverConnection, (message) => {
    if (rpc.isRequestMessage(message)) {
      if (message.method === lsp.InitializeRequest.type.method) {
        const initializeParams = message.params as lsp.InitializeParams;
        initializeParams.processId = process.pid;
      }
    }
    return message;
  });
};
