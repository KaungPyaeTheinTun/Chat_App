const { io } = require("../../frontend/node_modules/socket.io-client");

const port = process.env.VERIFY_PORT || "5000";
const apiBaseUrl = `http://127.0.0.1:${port}/api/v1`;
const socketBaseUrl = `http://127.0.0.1:${port}`;

const request = async (path, method = "GET", body = null, token = null) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
};

const registerDisposableUser = async (prefix, suffix) => {
  return request("/auth/register", "POST", {
    username: `${prefix}${suffix}`,
    email: `${prefix}${suffix}@example.com`,
    password: "password123",
    avatarUrl: `https://example.com/${prefix}.png`,
  });
};

const main = async () => {
  const suffix = Date.now();
  const userA = await registerDisposableUser("socketa", suffix);
  const userB = await registerDisposableUser("socketb", suffix);

  const tokenA = userA.data.accessToken;
  const tokenB = userB.data.accessToken;
  const userBId = userB.data.user.userId;
  const results = {
    presence: false,
    delivered: false,
    read: false,
  };

  const socketA = io(socketBaseUrl, {
    transports: ["websocket"],
    auth: { token: tokenA },
  });
  const socketB = io(socketBaseUrl, {
    transports: ["websocket"],
    auth: { token: tokenB },
  });

  let connected = 0;
  let finished = false;

  const finish = (error = null) => {
    if (finished) {
      return;
    }

    finished = true;
    socketA.disconnect();
    socketB.disconnect();

    if (error) {
      throw error;
    }

    console.log(JSON.stringify(results));
  };

  const timeout = setTimeout(() => {
    try {
      finish(new Error(`timeout:${JSON.stringify(results)}`));
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }, 15000);

  socketA.on("presence:changed", ({ userId, status }) => {
    if (userId === userB.data.user.userId && status === "online") {
      results.presence = true;
    }
  });

  socketB.on("message:received", ({ conversationId }) => {
    results.delivered = true;
    setTimeout(() => {
      socketB.emit("message:read", { conversationId }, () => {});
    }, 300);
  });

  socketA.on("message:read", () => {
    results.read = true;
    clearTimeout(timeout);
    try {
      finish();
      process.exit(0);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  });

  const maybeStart = () => {
    if (connected !== 2) {
      return;
    }

    socketA.emit(
      "message:send",
      {
        receiverId: userBId,
        content: "socket hello",
        messageType: "text",
      },
      (ack) => {
        if (!ack?.success) {
          clearTimeout(timeout);
          console.error(ack?.message || "socket send failed");
          process.exit(1);
        }
      },
    );
  };

  socketA.on("connect", () => {
    connected += 1;
    maybeStart();
  });

  socketB.on("connect", () => {
    connected += 1;
    maybeStart();
  });

  socketA.on("connect_error", (error) => {
    clearTimeout(timeout);
    console.error(error.message);
    process.exit(1);
  });

  socketB.on("connect_error", (error) => {
    clearTimeout(timeout);
    console.error(error.message);
    process.exit(1);
  });
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
