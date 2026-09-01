const test = require("node:test");
const assert = require("node:assert/strict");

const RoomManager = require("../src/socket/managers/RoomManager");
const ConnectionManager = require("../src/socket/managers/ConnectionManager");

test("RoomManager builds stable user and conversation rooms", () => {
  const manager = new RoomManager();

  assert.equal(manager.userRoom(4), "user:4");
  assert.equal(manager.conversationRoom(12), "conversation:12");
});

test("ConnectionManager tracks active sockets and offline transitions", async () => {
  const statusUpdates = [];
  const manager = new ConnectionManager(
    {
      set: async () => undefined,
    },
    {
      updateStatus: async (userId, status) => {
        statusUpdates.push({ userId, status });
      },
    },
  );

  await manager.connect(7, "socket-a");
  await manager.connect(7, "socket-b");
  const finalStatus = await manager.disconnect(7, "socket-a");
  const offlineStatus = await manager.disconnect(7, "socket-b");

  assert.equal(finalStatus, "online");
  assert.equal(offlineStatus, "offline");
  assert.deepEqual(statusUpdates.at(-1), { userId: 7, status: "offline" });
});
