var isRealString = str => {
  return typeof str === "string" && str.trim().length > 0;
};

var isPrivate = (text, room, users) => {
  if (text.charAt(0) !== "@") {
    return false;
  }

  var targetName = "";

  for (var i = 1; i < text.length; i++) {
    if (text.charAt(i) === " ") {
      break;
    }
    targetName += text.charAt(i);
  }

  return users.getUserbyNameRoom(targetName, room);
};

module.exports = { isRealString, isPrivate };
