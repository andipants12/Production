var express = require('express');
var path = require('path');
var https = require('https');
var app = express();
var fs = require('fs');
// var http = require('http').Server(app);
var socketIo = require('socket.io');

var BinaryServer = require('binaryjs').BinaryServer;
var request = require('request');

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

var binaryServer = BinaryServer({ port: 9000 });
var time = 0;
setInterval( function() {
  time++;
  // console.log(time, 'seconds passed since server started');
}, 1000);


var clients = [];
var numberOfUsers = 0;
var currentClientId = null;
var firstPersonStartTime = null;

binaryServer.on('connection', function(client) {
  clients[client.id] = client;
  currentClientId = client.id;
  console.log('in binary server, clientId : ', client.id, 'clients array : ', clients);

  // console.log(client.id);
  // client.send(client.id);
  // var mp3File = path.join(__dirname, '/hehey.mp3');
  // var lucky = 'https://www.youtubeinmp3.com/fetch/?video=https://www.youtube.com/watch?v=acvIVA9-FMQ';
  // var source = fs.createWriteStream(path.join(__dirname, './song.mp3'));
  // request
  // .get(lucky)
  // .pipe(source)
  // .on('finish', function() {
  //   console.log('mp3 download finished');
  //   var file = fs.createReadStream(path.join(__dirname, '/song.mp3'));
  //   client.send(file);
  // });
});

var io = socketIo.listen(server);
io.on('connection', function(socket) {
  numberOfUsers++;
  console.log('a user connected', numberOfUsers);

  socket.on('disconnect', function() {
    numberOfUsers--;
    console.log('user disconnected', numberOfUsers);
  });

  socket.on('songStarted', function(clientId) {
    if ( clientId === 0 ) {
      firstPersonStartTime = time;
      console.log('The first person started listening @ ', time);
    } else {
      socket.emit('changePlayTime', time - firstPersonStartTime);
      console.log('The song started in the client side : ', time);
    }
  });

  socket.on('getSong', function(clientId) {
    console.log('clientId in getSong event', clientId);
    var songFilePath = path.join(__dirname, '/song.mp3');
    var file = fs.createReadStream(songFilePath);
    clients[clientId].send(file);
  });

  socket.on('getId', function() {
    socket.emit('getId', currentClientId);
    console.log('send clientId back to user', currentClientId);
  });
});

/**************************************************************
Server
 *************************************************************/


app.use('/scripts', express.static(path.join(__dirname, '/../client/scripts')));
app.use(express.static(__dirname + '/../client'));

app.get('*', function (req, res) {
  console.log('server serving : ', req.method, ' @ ', req.url);
  res.sendFile(path.join(__dirname, '/../client/index.html'));
});





