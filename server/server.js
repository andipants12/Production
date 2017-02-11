var express = require('express');
var path = require('path');
var https = require('https');
var app = express();
var fs = require('fs');
var firebase = require('firebase');
require('firebase/auth');
require('firebase/database');
// var http = require('http').Server(app);
var socketIo = require('socket.io');

var BinaryServer = require('binaryjs').BinaryServer;
var request = require('request');

var init = firebase.initializeApp({
  apiKey: "AIzaSyDwImvGhB-lbBSlMwHaoH_wMhuRen4c5CI",
  authDomain: "perched-dd384.firebaseapp.com",
  databaseURL: "https://perched-dd384.firebaseio.com",
  storageBucket: "perched-dd384.appspot.com",
  messagingSenderId: "791147440152"
});
/*team count init*/
var fbDB = firebase.database();
// var teamInit = {red: 1, bool: true, blue: 0};
fbDB.ref('team').set({red: 0, bool: true, blue: 0});

//listener for team db path;

var localTeam = {};
fbDB.ref('team').on('value', function (snapshot) {
  localTeam = snapshot.val();
  console.log(localTeam, "localTeam has changed")
})

// listener for user db path
var userRemove = {};
fbDB.ref('user').on('child_removed', function (snapshot) {
  userRemove = snapshot.val();
  console.log('userRemove updated with snapshot', userRemove)
});

var options = {
  cert: fs.readFileSync('client-cert.pem'),
  key: fs.readFileSync('client-key.pem')
};

var server = https.createServer(options, app);

server.listen(3000, function () {
  console.log('Server listening on port 3000!');
});

 /**************************************************************
 Socket.Io and BinaryJS
 *************************************************************/
var getTime = function() {
  return (new Date).getTime().toString().slice(6) / 1000;
};

var binaryServer = BinaryServer({ port: 9000 });
// var time = 0;
// setInterval( function() {
//   time += .5;
//   // console.log(time, 'seconds passed since server started');
// }, 500);

var exampleClient = {
  socketId: '123123',
  client: {}
};

var clients = [];
var numberOfUsers = 0;
var currentClientId = null;
var currentSocketId = null;
var firstPersonStartTime = null;
var currentClients = {};

binaryServer.on('connection', function(client) {
  clients[client.id] = {
    client: client,
    socketId: null
  };
  currentClientId = client.id;
  console.log('new client!', clients);
  // console.log('in binary server, clientId : ', client.id, 'clients array : ', clients);
});

var io = socketIo.listen(server);
io.on('connection', function(socket) {
  //number of users that have entered
  //use % to check if even or odd, assign team based on evenness
  numberOfUsers++;
  teamCounter(numberOfUsers);
  var count = 0;
  currentSocketId = socket.id;
  console.log('a user connected', numberOfUsers);
  console.log('clients array', clients);
  socket.on('disconnect', function() {
    numberOfUsers--;
    decrementTeam(userRemove);
    // clients = clients.filter( function(clientObj) {
    //   return clientObj.socketId !== socket.id;
    // });
    currentClients[socket.id] = undefined;
    delete currentClients[socket.id];
    console.log('user disconnected', numberOfUsers);
    console.log('disconnected user id : ', socket.id);
    console.log('current clients array', clients);
  });

  socket.on('songStarted', function(clientId) {
    if ( clientId === 0 ) {
      firstPersonStartTime = getTime();
      console.log('The first person started listening @ ', getTime());
    } else {
      socket.emit('changePlayTime', getTime() - firstPersonStartTime);
      console.log('The song started in the client side : ', getTime());
    }
  });

  socket.on('getSong', function(clientId) {
    console.log('clientId in getSong event', clientId);
    var songFilePath = path.join(__dirname, '/song.mp3');
    var file = fs.createReadStream(songFilePath);
    if ( clients[clientId] ) {
      clients[clientId].client.send(file);    
    }
    // if ( clientId !== null ) {
    // } else {
    //   console.log('song could not be sent');
    // }
  });

  socket.on('getId', function() {
    console.log('current client id before error', currentClientId);
    clients[currentClientId].socketId = currentSocketId;
    currentClients[currentSocketId] = clients[currentClientId].client;
    console.log('send clientId back to user', currentClientId);
    console.log('current clients array', clients);
    socket.emit('getId', currentClientId);
  });

  socket.on('searchYoutube', function(videoId) {
    var songDownloadUrl = 'https://www.youtubeinmp3.com/fetch/?video=https://www.youtube.com/watch?v=' + videoId;
    var savePath = fs.createWriteStream(path.join(__dirname, './song.mp3'));

    request
    .get(songDownloadUrl)
    .pipe(savePath)
    .on('finish', function() {
      console.log('mp3 download finished');
      var mp3File = fs.createReadStream(path.join(__dirname, '/song.mp3'));
      firstPersonStartTime = getTime();
      console.log('current cleints : ', currentClients);
      for ( var client in currentClients ) {
        currentClients[client].send(mp3File);
      }
    })
    .on('error', function(err) {
      console.log('Error in downloading the song : ', err);
    });
  });

});

var teamCounter = function (currentCount) { 
  console.log('inside teamCounter', currentCount)
  if (currentCount % 2 === 0) {
    localTeam.blue += 1;
    console.log('inside teamCounte conditional blue', localTeam.blue);
    fbDB.ref('team/').update({
      blue: localTeam.blue
    });
  } else {
    localTeam.red += 1;
    console.log('inside teamCounte conditional red', localTeam.red);
    fbDB.ref('team/').update({
      red: localTeam.red
    });
  }
  localTeam.bool = !localTeam.bool;
  fbDB.ref('team/').update({
    bool: localTeam.bool
  });
}

// helper function to decrement team 
var decrementTeam = function (user) {
  var userTeam = user.team;
  if (userTeam === 'red') {
    localTeam.red = localTeam.red--;
    fbDB.ref('team').update({red: localTeam.red})
  } else {
    localTeam.blue = localTeam.blue--;
    fbDB.ref('team').update({blue: localTeam.blue});
  };
}

/**************************************************************
Server
 *************************************************************/


app.use('/scripts', express.static(path.join(__dirname, '/../client/scripts')));
app.use(express.static(__dirname + '/../client'));

app.get('*', function (req, res) {
  console.log('server serving : ', req.method, ' @ ', req.url);
  res.sendFile(path.join(__dirname, '/../client/index.html'));
});





