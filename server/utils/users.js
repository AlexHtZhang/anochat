const geolib = require("geolib");

class Users {
  constructor() {
    this.users = [];
  }
  addUser(id, name, room, location) {
    var user = { id, name, room, location };
    this.users.push(user);
    return user;
  }
  removeUser(id) {
    var user = this.getUser(id);

    if (user) {
      this.users = this.users.filter(user => user.id !== id);
    }

    return user;
  }
  getUser(id) {
    return this.users.filter(user => user.id === id)[0];
  }

  getUserbyNameRoom(name, room) {
    console.log(name, room);
    console.log(
      this.users.filter(user => user.name === name && user.room === room)
    );
    return this.users.filter(
      user => user.name === name && user.room === room
    )[0];
  }
  // return a object of {user: userlist.....}
  getUserList(room, curSocketID) {
    var curUser = this.getUser(curSocketID);

    var users = this.users.filter(user => user.room === room);

    var namesArrayObj = {};

    for (var i = 0; i < users.length; i++) {
      var curUser = users[i];

      var namesArray = users.map(user => {
        var newNameObject = {
          name: user.name,
          distance:
            curUser.location === "" || user.location === ""
              ? "unknown"
              : geolib.convertUnit(
                  "mi",
                  geolib.getDistance(curUser.location, user.location),
                  2
                )
        };
        return newNameObject;
      });

      var namesArrayNoGeoData = namesArray.filter(
        nameObj => nameObj.distance === "unknown"
      );

      var namesArrayGeoData = namesArray.filter(
        nameObj => nameObj.distance !== "unknown"
      );

      namesArrayGeoData.sort(function(nameObjA, nameObjB) {
        return nameObjA.distance - nameObjB.distance;
      });

      namesArray = namesArrayGeoData.concat(namesArrayNoGeoData);

      namesArrayObj[curUser.name] = namesArray;
    }
    console.log(namesArrayObj);
    return namesArrayObj;
  }
}

module.exports = { Users };
