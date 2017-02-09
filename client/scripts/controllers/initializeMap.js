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
    // console.log('databaseanauth.users', databaseAndAuth.users);
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

  var allUsers = databaseAndAuth.users;


  NgMap.getMap().then(function(map) {

  });

});
