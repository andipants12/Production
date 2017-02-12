/**
  * @class watchCurrentUserLocation
  * @description Controller for geolocation. Monitors user's location. Uses browser built-in method 'navigator.geolocation.watchPosition' that triggers every time there is a change in user's location (triggered when $rootScope broadcasts that user is currently logged in). 
*/
angular.module('myApp').controller('watchCurrentUserLocation', function($rootScope, $scope, databaseAndAuth) {
  /**
    * @function success
    * @memberOf watchCurrentUserLocation
    * @description Triggers when change in user location is detected. Sends the user's location to the database (based on the user's unique ID)
  */
  var success = function(response) {
    if ( $rootScope.loggedIn ) {
      console.log('success! ', response.coords);
      databaseAndAuth.database.ref('users/' + $scope.userId + '/coordinates').update({
        latitude: response.coords.latitude,
        longitude: response.coords.longitude
      });
      $rootScope.currentUserLoc = response.coords;
    } else {
      delete $rootScope.currentUserLoc;
    }
  };
  /**
    * @function error
    * @memberOf watchCurrentUserLocation
    * @description Gets invoked if browser is unable to retrieve/watch the user location
  */
  var error = function(item) {
    console.log('error! ', item);
  }
  /**
    * @params options
    * @memberOf watchCurrentUserLocation
    * @description Parameters for navigator.geolocation.watchPosition() that enable high accuracy mode (uses GPS, cellular tower signals, and WiFi, depending on avialability of each). It also accepts location information regardles of its age (Inifnity)
  */
  var options = {
    enableHighAccuracy: true,
    timeout: 1,
    maximumAge: Infinity
  };
  
  $scope.$on('user:logIn', function(event, data) {
    console.log(data, "data inside watchCurrentUserLocation controller")
    //data is the user's hash
    $scope.userId = data; 
    navigator.geolocation.watchPosition(success, error, options);
  });

  $scope.$on('user:loggedOut', function(event, data) {
    console.log(data, "data inside loggedOut clear geolocation")
    //data is the user's hash
    navigator.geolocation.clearWatch(data);
  });
});