/**
  * @class initializeMap
  * @description Controller for Google Maps. Makes use of databaseAndAuth factory in order to retrieve/update chat messages from the databse. Listens for any changes in $rootScope (broadcasted by services), and then takes in the new (broadcasted) data and applies it to $scope
*/

angular.module('myApp').controller('initializeMap', function($scope, databaseAndAuth, NgMap) {


  $scope.$on('user:updatedOrAdded', function(event, data) {
    $scope.userLocations[data[0]] = data[1];
    console.log('user location added or updated', data[1]);
    $scope.$apply();
  });

  $scope.$on('user:loggedOut', function(event, data) {
    $scope.userLocations = undefined;
    $scope.$apply();
  });

  $scope.$on('user:logIn', function(event, data) {
    $scope.userLocations = databaseAndAuth.users;
    console.log('data logIn', databaseAndAuth.users[data])

    $scope.currentUser = databaseAndAuth.users[data];

    $scope.alert = 'You are on team ' + $scope.currentUser.team + '!';

    $scope.$apply();
  });

  $scope.setPinIcon = function (user) {
    var icons = {
      blue: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      red: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    };

    if (user.team === 'blue') {
      return icons.blue;
    } else if (user.team === 'red') {
      return icons.red;
    }
  };

  $scope.show = true;

  $scope.closeAlert = function() {
    $scope.show = false;
  }

  NgMap.getMap().then(function(map) {

  });

  $scope.socket = io();
  $scope.clientId = null;
  $scope.client = new BinaryClient('ws://localhost:9000');
  $scope.getSong = function() {
    console.log('Inside getSong');
    $scope.socket.emit('getSong', $scope.clientId);
  };
  
  $scope.client.on('stream', function(stream, meta) {
    console.log('server sent an mp3 file');
    var parts = [];
    var audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.preload = true;
    audioPlayer.autoplay = true;
    audioPlayer.controls = 'controls';
    
    stream.on('data', function(data) {
      parts.push(data);
    });
    
    stream.on('end', function() {
      console.log('ended', parts);
      audioPlayer.src = (window.URL || window.webkitURL).createObjectURL( new Blob(parts) );
      $scope.socket.emit('songStarted', $scope.clientId);
    });
  }); 


  $scope.client.on('open', function() {
    $scope.socket.emit('getId');
    console.log('open connection with binaryJS Server');
  });

  $scope.socket.on('getId', function(clientId) {
    $scope.clientId = clientId;
    console.log('inside getId event listener');
  });

  $scope.socket.on('changePlayTime', function(currentSongTime) {
    var audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.currentTime = currentSongTime;
    console.log('inside changePlayTime event listener');
  });
  // Youtube

  axios({
    url: 'https://www.googleapis.com/youtube/v3/search',
    method: 'get',
    params: {
      part: 'snippet',
      // remember to hide the key to a variable!
      key: 'AIzaSyDFXqX6S69-lw5DsBdYgsygRoBavtNPyKY',
      q: context.state.value
    }
  })
  .then( function(youtubeResponse) {
  // wait for Youtube res to come back
    console.log('youtube search success!');
    // grab the array of videos, which live in data.items
    var searchResult = youtubeResponse.data.items;

    context.setState({searchResults: searchResult});

    console.log('This is youtubeResponse : ', youtubeResponse);

  })
  .catch( function(err) {
    console.log('youtube search fail', err);

  });

});
