// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
const https = require('https');
const fs = require('fs');


// This sample is using the easyrtc from parent folder.
// To use this server_example folder only without parent folder:
// 1. you need to replace this "require("../");" by "require("easyrtc");"
// 2. install easyrtc (npm i easyrtc --save) in server_example/package.json

var easyrtc = require("../"); // EasyRTC internal module

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(serveStatic('static', {'index': ['index.html']}));

// Start Express http server on port 8080
var webServer = http.createServer(app);


// serve the API with signed certificate on 443 (SSL/HTTPS) port
const httpsServer = https.createServer({
  key: fs.readFileSync('/root/ssl/star_ipozal_com.key'),
  cert: fs.readFileSync('/root/ssl/STAR_ipozal_com.crt'),
}, app);



// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});
/*var myIceServers = [
   {
     "urls": [
       "turn:176.9.28.86:3478?transport=udp",
       "turn:176.9.28.86:3478?transport=tcp"
     ],
     "username": "live1",
     "credential": "882211"
   }
];
*/
    var myIceServers = [
      {"url":"stun:176.9.28.86:3478"}
    ];

//    easyrtc.setOption("appIceServers", myIceServers);

easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("appIceServers", myIceServers);

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
console.log("\n\n\n AUTH ::: "+easyrtcid + " - " + JSON.stringify(msg)+"\n\n\n");
//msg.msgData.credential="882211";
//msg.msgData.user="live1";
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
		console.log("\n\n\n BADDDDDDD "+JSON.stringify(msg.msgData.credential)+"\n\n\n");
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

// Listen on port 8080
webServer.listen(8080, function () {
    console.log('listening on http://localhost:8080');
});
httpsServer.listen(4430, () => {
    console.log('HTTPS Server running on port 443');
});

