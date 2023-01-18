const socket = io();

communityList = [
  "General",
  "React",
  "TypeScript",
  "Java",
  "Python",
  "Ruby",
  "C#",
  "C++",
  "NewBies",
  "Open-Source",
];

const chatPage = document.getElementById("chat-display");
const inputForm = document.getElementById("inputMessage");

let currentRoom;

$(document).ready(function () {
  // Get username and room from URL
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const { username, community } = params;
  currentRoom = community;

  socket.emit("newUser", username, community);
  socket.emit("updateMembersList");

  fetch(`/chatHistory?community=${currentRoom}`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
    });

  //   displaying the list of channels

  let communityOnload = communityList.map((channel) => {
    return $(".channels-list").append(
      `<li   id=${channel} class="p-2"><a onclick ="changeRoom('${channel}')">#${channel}</a></li>`
    );
  });
  $(`#${community}`).addClass("active-channel");
  $(".channels-list").scrollTop($(`#${community}`).offset().bottom + 500);

  //load chat history

  //Add active class to clicked channel
  $(".channels-list li").click(() => {
    let links = $(".channels-list li").click(function () {
      $(this)
        .closest("ul")
        .find("li.active-channel")
        .removeClass("active-channel");
      $(this).addClass("active-channel");
      const anchorValue = $(this).text();
      $(".channel-title").text(anchorValue);
    });
  });

  //Show user list

  socket.on("loadChatHistory", (messageHistory) => {
    messageHistory.map((history) => {
      let dateObj = new Date(history.createdAt);
      const timeSent = moment(dateObj).calendar();
      let messageHTML = `<li class="list-unstyled"><div class="p-2 position-relative my-message  message-title ">
                            <div class="p-2"> ${history.text} </div>
                            <div class="position-absolute end-0 mt-3 ">
                                <span>${timeSent}</span>

                            </div>

                            <div class="position-absolute start-0 mt-3">
                                <div><i class="fa-solid fa-user-tie me-2"></i>${username}</div>
                            </div>
                        </div></li>`;
      return (chatPage.innerHTML += messageHTML);
    });
  });

  socket.on("showUsers", (users) => {
    users.map((user) => {
      return $(".member-list").append(`<li>
                                <div class="d-flex justify-content-between">
                                    <div class="d-flex">
                                        <i class="fa-solid fa-user-tie me-2"></i>
                                        <p>${user.username}</p>

                                    </div>

                                    <i class="fa-solid fa-circle ms-2 status-icon"></i>
                                </div>
                            </li>`);
    });
  });

  //Update chat message
  socket.on("updateChatMessage", (id, chatRoom, username, text) => {
    let messageHTML;
    const timeSent = moment().calendar();
    if (id === "ChatBot" && chatRoom === community) {
      messageHTML = `<li class="list-unstyled"><div class="p-2 position-relative w-100  message-title px-4 me-5">
                            <div class="p-2"> ${text}</div>
                            <div class="position-absolute end-0 me-2 mt-3 ">
                                <span>${timeSent}</span>

                            </div>
                        </div></li>`;
      chatPage.innerHTML += messageHTML;
    } else if (id === "ChatBot" && chatRoom !== community) {
      messageHTML = `<li class="list-unstyled"><div class="p-2 position-relative w-100  message-title px-4 me-5">
                            <div class="p-2"> ${text}</div>
                            <div class="position-absolute end-0 me-2 mt-3 ">
                                <span>${timeSent}</span>

                            </div>
                        </div></li>`;
      chatPage.innerHTML = messageHTML;
    } else if (id === "myMessage") {
      if (username === username) {
        messageHTML = `<li class="list-unstyled"><div class="p-2 position-relative my-message  message-title ">
                            <div class="p-2"> ${text} </div>
                            <div class="position-absolute end-0 mt-3 ">
                                <span>${timeSent}</span>

                            </div>

                            <div class="position-absolute start-0 mt-3">
                                <div><i class="fa-solid fa-user-tie me-2"></i>${username}</div>
                            </div>
                        </div></li>`;
      } else {
        messageHTML = `<li class="list-unstyled"><div class="p-4 position-relative  message-title ">
                            <div class="p-2"> ${text} </div>
                            <div class="position-absolute end-0 mt-3 ">
                                <span>${timeSent}</span>

                            </div>

                            <div class="position-absolute start-0 mt-3">
                                <div><i class="fa-solid fa-user-tie me-2"></i>${username}</div>
                            </div>
                        </div></li>`;
      }

      chatPage.innerHTML += messageHTML;
    }
  });

  $("#sendMessage").click((e) => {
    const message = $("#inputMessage").val();
    socket.emit("sendMessage", message);
    inputForm.value = "";
  });
});

const changeRoom = (room) => {
  console.log(room);
  if (room !== currentRoom) {
    socket.emit("updateCurrentRoom", room);
    currentRoom = room;
    fetch(`/chatHistory?community=${currentRoom}`).then((res) => {
      console.log(res);
    });
  }
};
