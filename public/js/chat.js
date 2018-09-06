var socket = io();

function scrollToBottom() {
  // Selectors
  var messages = jQuery("#messages");
  var newMessage = messages.children("li:last-child");
  // Heights
  var clientHeight = messages.prop("clientHeight");
  var scrollTop = messages.prop("scrollTop");
  var scrollHeight = messages.prop("scrollHeight");
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();

  if (
    clientHeight + scrollTop + newMessageHeight + lastMessageHeight >=
    scrollHeight
  ) {
    messages.scrollTop(scrollHeight);
  }
}

function emitWithGeoLocation(params) {
  if (!navigator.geolocation) {
    params["location"] = "";
    return alert("Geolocation not supported by your browser.");
  }

  navigator.geolocation.getCurrentPosition(
    function(position) {
      params["location"] = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      socket.emit("join", params, function(err) {
        if (err) {
          alert(err);
          window.location.href = "/";
        } else {
          console.log("No error");
        }
      });
    },
    function() {
      params["location"] = "";
      socket.emit("join", params, function(err) {
        if (err) {
          alert(err);
          window.location.href = "/";
        } else {
          console.log("No error");
        }
      });
      alert("Unable to fetch location.");
    }
  );
}

socket.on("connect", function() {
  var params = jQuery.deparam(window.location.search);
  emitWithGeoLocation(params);
});

socket.on("disconnect", function() {
  console.log("Disconnected from server");
});

// have to have unique name with in the same chat room. Use user socketid at client side code to ensure private sent message will leak info.
var sidebarUserArray;

socket.on("updateUserList", function(users) {
  sidebarUserArray = users;

  var ol = jQuery("<ol></ol>");

  users.forEach(function(user) {
    ol.append(jQuery("<li></li>").text(user.name + " " + user.distance + "mi"));
  });

  jQuery("#users").html(ol);
});

socket.on("newMessage", function(message) {
  var formattedTime = moment(message.createdAt).format("h:mm a");
  var template = jQuery("#message-template").html();
  var html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime,
    distance:
      message.from !== "AnoChatRobot"
        ? sidebarUserArray.filter(user => user.name === message.from)[0]
            .distance
        : "unknown"
  });

  jQuery("#messages").append(html);
  scrollToBottom();
});

socket.on("newLocationMessage", function(message) {
  var formattedTime = moment(message.createdAt).format("h:mm a");
  var template = jQuery("#location-message-template").html();
  var html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });

  jQuery("#messages").append(html);
  scrollToBottom();
});

jQuery("#message-form").on("submit", function(e) {
  e.preventDefault();

  var messageTextbox = jQuery("[name=message]");

  socket.emit(
    "createMessage",
    {
      text: messageTextbox.val()
    },
    function() {
      messageTextbox.val("");
    }
  );
});

var locationButton = jQuery("#send-location");
locationButton.on("click", function() {
  if (!navigator.geolocation) {
    return alert("Geolocation not supported by your browser.");
  }

  locationButton.attr("disabled", "disabled").text("Sending location...");

  navigator.geolocation.getCurrentPosition(
    function(position) {
      locationButton.removeAttr("disabled").text("Send location");
      socket.emit("createLocationMessage", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    function() {
      locationButton.removeAttr("disabled").text("Send location");
      alert("Unable to fetch location.");
    }
  );
});
