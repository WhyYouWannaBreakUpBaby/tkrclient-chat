// TKR Chat frontend.
// Change this to the public WebSocket URL of your deployed server.
const WS_URL = "wss://YOUR-CHAT-SERVER.example.com";

const $ = (id) => document.getElementById(id);
const messages = $("messages");
const users = $("users");
const status = $("status");
const roomInput = $("room");
let socket;
let username = localStorage.getItem("tkrChatName") || "";
let currentRoom = "general";

function cleanName(value) {
  return value.trim().replace(/[^\w .-]/g, "").slice(0, 24);
}

function getName() {
  if (!username) {
    username = cleanName(prompt("Choose a chat name:", "Guest") || "Guest");
    if (!username) username = "Guest";
    localStorage.setItem("tkrChatName", username);
  }
  return username;
}

function addSystem(text) {
  const div = document.createElement("div");
  div.className = "system";
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addMessage(msg) {
  const wrap = document.createElement("article");
  wrap.className = "message";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${msg.user} • ${new Date(msg.time).toLocaleTimeString()}`;

  const body = document.createElement("div");
  body.className = "body";
  body.textContent = msg.text;

  wrap.append(meta, body);
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}

function renderUsers(list) {
  users.replaceChildren();
  list.forEach((name) => {
    const div = document.createElement("div");
    div.className = "user";
    div.textContent = name;
    users.appendChild(div);
  });
}

function connect() {
  const url = WS_URL.replace(/\/$/, "");
  if (url.includes("YOUR-CHAT-SERVER")) {
    status.textContent = "Set WS_URL in script.js";
    return;
  }

  socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    status.textContent = "Connected";
    socket.send(JSON.stringify({
      type: "join",
      room: currentRoom,
      user: getName()
    }));
  });

  socket.addEventListener("message", (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }

    if (data.type === "history") {
      messages.replaceChildren();
      data.messages.forEach(addMessage);
    } else if (data.type === "message") {
      addMessage(data.message);
    } else if (data.type === "system") {
      addSystem(data.text);
    } else if (data.type === "users") {
      renderUsers(data.users);
    }
  });

  socket.addEventListener("close", () => {
    status.textContent = "Disconnected — refresh to reconnect";
  });

  socket.addEventListener("error", () => {
    status.textContent = "Connection error";
  });
}

$("messageForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = $("message").value.trim();
  if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({type:"message", text}));
  $("message").value = "";
  $("message").focus();
});

$("joinBtn").addEventListener("click", () => {
  const room = roomInput.value.trim().replace(/[^\w-]/g, "").slice(0, 32) || "general";
  currentRoom = room;
  messages.replaceChildren();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({type:"join", room, user:getName()}));
  }
});

getName();
connect();
