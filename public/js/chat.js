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

//loading Jquery plugin to execute on page load
$(document).ready(function () {
  // Get username and room from URL
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const { username, community } = params;
  currentRoom = community;
  //displaying the list of our communities on load
  //   displaying the list of channels

  communityList.map((channel) => {
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

  // Send new user details to the server and update the list of users
  socket.emit("newUser", username, community);

  //update the chatPage with messages

  socket.on("updateChat", (room, username, updatedChatList) => {
    let sender;
    let messageHTML;
    console.log(room);
    updatedChatList.map((chat) => {
      if (chat.sender === null && currentRoom === room) {
        let dateObj = new Date(chat.createdAt);
        const timeSent = moment(dateObj).calendar();
        sender = "AdminBot";
        messageHTML = `<li class="list-unstyled"><div class="p-2 position-relative w-100 me-4 admin message">
                            <div class="p-2"> ${chat.text} </div>
                            <div class="position-absolute end-0 mt-3 ">
                                <span class="fst-italic small">${timeSent}</span>

                            </div>

                            <div class="position-absolute start-0 mt-3">
                                <div class=""><i class="fa-solid fa-user-tie me-2 small"></i>${sender}</div>
                            </div>
                        </div></li>`;
        return (chatPage.innerHTML += messageHTML);
      } else if (currentRoom !== room) {
        console.log("here");
        messageHTML = `<li class="list-unstyled"><div class="p-2 position-relative w-100  message-title px-4 me-5">
                            <div class="p-2"> ${text}</div>
                            <div class="position-absolute end-0 me-2 mt-3 ">
                                <span>${timeSent}</span>

                            </div>
                        </div></li>`;
        chatPage.innerHTML = messageHTML;
      }
    });
  });

  socket.on("showUsers", (users) => {
    users.map((user) => {
      return $(".member-list").append(`<li>
                                <div class="d-flex justify-content-between">
                                    <div id="members" class="d-flex">
                                        <i class="fa-solid fa-user-tie me-2"></i>
                                        <p>${user.username}</p>

                                    </div>

                                    <i class="fa-solid fa-circle ms-2 status-icon"></i>
                                </div>
                            </li>`);
    });
  });
});

const changeRoom = (room) => {
  if (room !== currentRoom) {
    socket.emit("updateCurrentRoom", room);
    currentRoom = room;
  }
};
