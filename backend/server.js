require("dotenv").config();

const http = require("http");
const createApp = require("./src/app");
const buildSocketServer = require("./src/socket/socketServer");

const { app, services } = createApp();
const server = http.createServer(app);
buildSocketServer(server, services);

const port = Number(process.env.PORT || 5000);

server.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
