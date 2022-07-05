const messagesContainer = document.querySelector("#messages-container");
const channelForm = document.querySelector("#channel-form");
const channelFormInput = document.querySelector("#channel-form input");
const channelNameText = document.querySelector("#channel-name-text");

let connectedChannels = [];
let channels = localStorage.getItem("twitch-connected-channels");
loadRecentChannels();

channelForm.addEventListener("submit", (event) => {
  event.preventDefault();
  messagesContainer.innerHTML = "";
  const formData = new FormData(channelForm);
  const channel = formData.get("channel-name").toLowerCase();
  if (!channel) return;
  const client = new tmi.Client({
    channels: [channel],
  });
  client.connect();
  saveChannel(channel);
  channelNameText.innerHTML = `<i class="bi bi-camera-video-fill me-2"></i> <span id="view-channel-name">${channel}</span>`;
  channelForm.reset();

  client.on("message", (channel, tags, message, self) => {
    if (self) return;
    const avatarUrl = `https://unavatar.io/twitter/${tags["display-name"]}`;
    const messageElement = document.createElement("li");
    messageElement.classList.add("message");
    const messageContent = {
      name: tags["display-name"],
      message,
    };
    messageElement.innerHTML = `<img src="${avatarUrl}"> <span id="chat-name">${messageContent.name}</span> ${messageContent.message}`;
    const chatName = messageElement.querySelector("#chat-name");
    if (tags.color) {
      chatName.style.color = tags.color;
      chatName.style.fontWeight = "bold";
    } else {
      chatName.style.color = "#7744d5";
      chatName.style.fontWeight = "bold";
    }
    if (message.includes("@")) {
      let [mention, ...args] = message.split(" ");
      messageElement.innerHTML = `<img src="${avatarUrl}"> <span id="chat-name">${
        messageContent.name
      }</span> <span class="purple text-decoration-underline">${mention}</span> ${args.join(
        " "
      )}`;
    }

    if (
      messageContent.name == "Nightbot" ||
      messageContent.name == "Streamlabs"
    ) {
      messageElement.innerHTML = `<i class="bi bi-robot"></i> <span id="chat-name">${messageContent.name}</span>: ${messageContent.message}`;
      messageElement.style.border = "2px solid #f00";
    }
    if (
      tags.badges &&
      tags.badges.subscriber &&
      messageContent.name !== "Nightbot"
    ) {
      messageElement.innerHTML = `<img src="${avatarUrl}"> <i class="bi bi-twitch purple fs-3"></i> <span id="chat-name">${messageContent.name}</span>: ${messageContent.message}`;
    }
    if (tags.badges && tags.badges.broadcaster) {
      messageElement.innerHTML = `<i class="bi bi-camera-video-fill red"></i> <span id="chat-name">${messageContent.name}</span>: ${messageContent.message}`;
      messageElement.style.border = "2px solid #f00";
    }
    messagesContainer.appendChild(messageElement);
    messageElement.scrollIntoView();

    client.on(
      "subscription",
      (channel, username, method, message, userstate) => {
        const subMessage = document.createElement("li");
        subMessage.classList.add("message");
        subMessage.innerHTML = `<i class="bi bi-star-fill fs-3"></i> <span id="chat-name">${username}</span> has suscribed`;
        messagesContainer.appendChild(subMessage);
        subMessage.scrollIntoView();
      }
    );
    client.on("cheer", (channel, userstate, message) => {
      const cheerMessage = document.createElement("li");
      cheerMessage.classList.add("message");
      cheerMessage.innerHTML = `<i class="bi bi-currency-dollar fs-3"></i> <span id="chat-name">${userstate.username}</span> has cheered ${userstate.bits} bits`;
      messagesContainer.appendChild(cheerMessage);
      cheerMessage.scrollIntoView();
    });

    // TODO: Implemnt rest of events
    // TODO: Render emotes in chat
  });
});

function loadRecentChannels() {
  if (JSON.parse(channels)) {
    messagesContainer.classList.add("mt-5");
    messagesContainer.innerHTML = `<p id="recent-channels-title"><i class="bi bi-clock-fill fs-3"></i> Recent channels <button class="btn btn-sm clear-recent-channels-button"><i class="bi bi-trash-fill fs-4"></i> Clear</button></p>`;
    for (let i = 0; i < JSON.parse(channels).length; i++) {
      let streamerAvatarUrl = `https://unavatar.io/twitter/${
        JSON.parse(channels)[i]
      }`;
      const channelElement = document.createElement("li");
      const joinChannelButton = document.createElement("button");
      joinChannelButton.classList.add("btn", "btn-sm");
      channelElement.classList.add("channel");
      joinChannelButton.innerHTML = `<i class="bi bi-chat-dots-fill"></i> Connect`;
      channelElement.innerHTML = `<img src="${streamerAvatarUrl}"><i class="bi bi-camera-video-fill streamer-icon"></i> <p>${
        JSON.parse(channels)[i]
      }</p>`;
      channelElement.appendChild(joinChannelButton);
      messagesContainer.appendChild(channelElement);
      joinChannelButton.addEventListener("click", () => {
        channelFormInput.value = JSON.parse(channels)[i];
      });
    }
    const clearRecentChannels = document.querySelector(
      ".clear-recent-channels-button"
    );
    clearRecentChannels.addEventListener("click", () => {
      location.reload();
      localStorage.clear();
    });
  }
}

function saveChannel(channel) {
  if (!connectedChannels.includes(channel)) {
    connectedChannels.push(channel);
    localStorage.setItem(
      "twitch-connected-channels",
      JSON.stringify(connectedChannels)
    );
  }
}
