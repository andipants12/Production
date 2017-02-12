/**
  * @class initializeMap
  * @description Controller for Google Maps. Makes use of databaseAndAuth factory in order to retrieve/update chat messages from the databse. Listens for any changes in $rootScope (broadcasted by services), and then takes in the new (broadcasted) data and applies it to $scope
*/

angular.module('myApp').controller('initializeMap', function($scope, databaseAndAuth, NgMap, $rootScope) {

  $scope.calculateDistance = function(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 +
            c(lat1 * p) * c(lat2 * p) *
            (1 - c((lon2 - lon1) * p)) / 2;

   return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  };

 $scope.captureEnemy = function() {
    var allUsers = $scope.userLocations;
    var currentUserId = databaseAndAuth.auth.currentUser.uid;
    var currentUserCoords = allUsers[currentUserId].coordinates;
    var currentUserTeam = allUsers[currentUserId].team;
    console.log('In captureEnemy function!');    
    for ( var user in allUsers ) {
      console.log(allUsers[user]);    
      var userObject = allUsers[user];
      if ( userObject.coordinates ) {
        var distance = $scope.calculateDistance(currentUserCoords.latitude, currentUserCoords.longitude, userObject.coordinates.latitude, userObject.coordinates.longitude);
        if ( distance < 10 && distance !== 0 ) {
          console.log('currentUserTeam', currentUserTeam, currentUserCoords, distance)
          databaseAndAuth.database.ref('users/' + user).update({
            team: currentUserTeam
          });
        }
      }
    }
  };

  $scope.$on('user:updatedOrAdded', function(event, data) {
    console.log('updated or added', data);
    if(!!$scope.userLocations) {
      $scope.userLocations[data[0]] = data[1];
      console.log('user location added or updated', data[1]);
      $scope.$apply();
    }
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
  for ( var i = 0; i < 10000; i++ ) {
    // buy time
  }
  $scope.socket = io();
 
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
    audioPlayer.src = null;

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

  $scope.searchText = '';
  $scope.getYoutube = function() {
    console.log('This was query : ', $scope.searchText);
    axios({
      url: 'https://www.googleapis.com/youtube/v3/search',
      method: 'get',
      params: {
        part: 'snippet',
        key: 'AIzaSyDFXqX6S69-lw5DsBdYgsygRoBavtNPyKY',
        q: $scope.searchText
      }
    })
    .then( function(youtubeResponse) {
      console.log('youtube search success!');
      var searchResult = youtubeResponse.data.items;
      var songInfo = searchResult[0];
      var songId = songInfo.id.videoId;
      $scope.socket.emit('searchYoutube', songId);
      console.log('This is youtubeResponse : ', searchResult);
    })
    .catch( function(err) {
      console.log('youtube search fail', err);
    });
    $scope.searchText = '';
  };
  $scope.handleChange = function(value) {
    $scope.searchText = value;
    console.log('inside handleChange', value);
  };


});
