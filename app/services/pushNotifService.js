const async = require('async');
const https = require('https');
const config = require('../config/configProvider.js')();

const getAppId = () => {
  return config["oneSignal.appId"];
};

const headers = {
  "Content-Type": "application/json",
  "Authorization": "Basic " + config["oneSignal.token"]
};

const requestOptions = () => {
  return {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + config["oneSignal.token"]
    }
  };
};

const sendNotification = data => {
  var req = https.request(requestOptions(), (res, body) => {
    res.on('data', data => {
      console.log("[SUCCESS] Push Notif Send");
    });
  });

  req.on('error', e => {
    console.log("ERROR:", e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

const customerNewApplication = playerId => {
  if (!playerId) {
    return;
  }
  
  console.log("[INFO] Sending push notif to player", playerId);
  var message = {
    app_id: getAppId(),
    contents: {
      "en": "New application for your task!",
      "de": "Neue Bewerbung für deine Aufgabe!"
    },
    include_player_ids: [playerId],
    ios_badgeType: "Increase",
    ios_badgeCount: 1,
  };

  sendNotification(message, "client");
};

var customerAssistantMarkedDone = playerId => {
  if(!playerId){
    return;
  }
  console.log("[INFO] Sending push notif to player", playerId);
  var message = {
    app_id: getAppId(),
    contents: {
      "en": "Your Assistant has marked the task as done!",
      "de": "Dein Assistant hat die Aufgabe als erledigt markiert!"
    },
    include_player_ids: [playerId],
    ios_badgeType: "Increase",
    ios_badgeCount: 1,
  };
  sendNotification(message, "client");
};


var youHaveBeenPaidNotif = (playerId, amount) => {
  if (!playerId) {
    return console.error("PlayerId not specifed.");
  }

  console.log("[INFO] Sending push notif to player", playerId);
  var message = {
    app_id: getAppId(),
    contents: {
      "en": (amount / 100).toFixed(2) + "€ has been transfered to your StudenTask eWallet.",
      "de": (amount / 100).toFixed(2) + "€ wurde deinem eWallet gutgeschrieben."
    },
    include_player_ids: [playerId],
    ios_badgeType: "Increase",
    ios_badgeCount: 1,
  };
 
  sendNotification(message, "client");
};


function assistantChosenForTask (playerId) {
  if (!playerId) {
    return;
  }

  console.log("[INFO] Sending push notif to player", playerId);
  var message = {
    app_id: getAppId("client"),
    contents: {
      "en": "Your application has been accepted!",
      "de": "Deine Bewerbung wurde akzeptiert!"
    },
    include_player_ids: [playerId],
    ios_badgeType: "Increase",
    ios_badgeCount: 1,
  };
  sendNotification(message,"client");

}

var assistantAssignedToTask = playerId => {
  if(!playerId){
    return;
  }
  console.log("[INFO] Sending push notif to player", playerId);
  var message = {
    app_id: getAppId(),
    contents: {
      "en": "Your application has been accepted!",
      "de": "Deine Bewerbung wurde akzeptiert!"
    },
    include_player_ids: [playerId],
    ios_badgeType: "Increase",
    ios_badgeCount: 1,
  };
  sendNotification(message,"client");
};

var newRelevantTask = function(PlayersId){
  if(!PlayersId){
    return;
  }
    console.log("[INFO] Sending push notif to player", PlayersId);
  var message = {
    app_id: getAppId("client"),
    contents: {
      "en": "New task in your neighborhood!",
      "de": "Neue Aufgabe in der Nähe!"
    },
    include_player_ids: PlayersId,
    ios_badgeType: "Increase",
    ios_badgeCount: 1,
  };
  
  sendNotification(message,"client");
};

module.exports = {
  assistantChosenForTask : assistantChosenForTask,    
  youHaveBeenPaidNotif : youHaveBeenPaidNotif,
  newRelevantTask: newRelevantTask,
  assistantAssignedToTask: assistantAssignedToTask,
  customerAssistantMarkedDone: customerAssistantMarkedDone,
  customerNewApplication: customerNewApplication,
  sendNotification: sendNotification,
};