/**
  * @class registerLogInLogOut
  * @description Controller for that handles user registration (new user), user login, and user logout. Makes use of databaseAndAuth and runListeners factories.
*/
angular.module('myApp').controller('registerLogInLogOut', function($rootScope, $scope, $location, databaseAndAuth, runListeners) {

  /**
    * @function '$scope.register'
    * @memberOf registerLogInLogOut
    * @description Handles uer registration. Creates a new user (uding Firebase native method 'createUserWithEmailAndPassword'). Extracts username from user's email (username is anything that comes before @ symbol e.g. john06@gmail.com will have username of john06). Uses promises to add user to the database after they are created. Each user is listed under their unique Id provided by Firebase authentication system (user.uid)
    Assigns user to team and updates the team counts, as well as boolean counter in the database;
  */


  $scope.register = function() {
    var register = databaseAndAuth.auth.createUserWithEmailAndPassword($scope.email, $scope.password);

    register.then(function(user) {
      databaseAndAuth.database.ref('users/' + user.uid).set({
        username: $scope.email.slice(0, $scope.email.indexOf('@')),
        email: $scope.email,
        team: 'red'
      });
      $rootScope.loggedIn = true;
      
      //team assignment
      var assignedTeam;
      if(databaseAndAuth.team.bool) {
        var count = databaseAndAuth.team.blue;
        databaseAndAuth.database.ref('team/').update({
          blue: count + 1
        });
        assignedTeam = 'blue';
      } else {
        var count = databaseAndAuth.team.red;
        databaseAndAuth.database.ref('team/').update({
          red: count + 1
        });
        assignedTeam = 'red';
      }
      databaseAndAuth.database.ref('users/' + user.uid).update({
          team: assignedTeam
      });
      alert('Congragulations! You are on team ' + assignedTeam);
      databaseAndAuth.database.ref('team/').update({
        bool: !databaseAndAuth.team.bool
      })
      runListeners.teamAssigned();

      $location.path('/map');
    })

    register.catch(function(error) {
      console.log(error.message);
    });
  };
  /**
    * @function '$scope.logIn'
    * @memberOf registerLogInLogOut
    * @description Handles user login. Logs in an existing user (using Firebase native method 'signInWithEmailAndPassword'). Uses promises to register successful login or to catch erors. Upon login, removes any text from the input fields. Upon erorr, shows the error message to the user
  */
  $scope.logIn = function() {
    var login = databaseAndAuth.auth.signInWithEmailAndPassword($scope.email, $scope.password);
    login.then(function(user) {
      $rootScope.email = $scope.email;
      $rootScope.password = $scope.password;
      $rootScope.userCredentials = {
        email: user.email
      }
      fetchMessages();
      getUsers();
      localStorage.setItem('user', user);
      $scope.email = '';
      $scope.password = '';
      $scope.badLogin = '';
      $scope.$apply();

      $rootScope.loggedIn = true;
      $location.path('/map');
    });
    login.catch(function(error) {
      console.log(error.message);
      $scope.badLogin = error.message + ' If you don\'t have an account, please sign up!'
      $scope.$apply();
      $rootScope.loggedIn = false;
      $location.path('/');
    })
  };
  /**
    * @function '$scope.logOut'
    * @memberOf registerLogInLogOut
    * @description Handles user logout. Logs out an existing user (using Firebase native methods 'remove()' and 'signOut()'). Uses promises. When user clicks the logout button, removes their coordinates from the database. After that it broadcasts (on $rootScope) that the user has logged out, and then it signs them out to remove any session data. Note: Database stores their chat messages and location, while authentication holds their session. That's why both need to be removed using .remove() and .signOut()
  */
  $scope.userPreviousLocation = null;
  $scope.checkUserLocation = function() {
    if ( $scope.userPreviousLocation === null || $rootScope.loggedIn === false ) {
      $scope.userPreviousLocation = $rootScope.currentUserLoc;
      console.log('First time check user location');
    } else {
      console.log('Compare previousLocation and currentLocation');
      console.log('previousLocation', $scope.userPreviousLocation);
      console.log('currentLocation', $rootScope.currentUserLoc);
      if ( JSON.stringify($scope.userPreviousLocation) === JSON.stringify($rootScope.currentUserLoc) ) {
        console.log('Kick out inactive user');
        $scope.logOut();
      }
    }
  };

  setInterval($scope.checkUserLocation, 180000);

  $scope.logOut = function() {
    //on logout remove the user's coordinates from database
    var logout = databaseAndAuth.database.ref('users/' + $scope.userId + '/coordinates').remove();
    //then sign them out
    logout.then(function(){
      console.log('logged out');
      localStorage.removeItem('user');
      $rootScope.$broadcast('user:loggedOut', '');
      databaseAndAuth.auth.signOut();
      console.log('user logged out: ', $scope.userId);
      $rootScope.loggedIn = false;
      $location.path('/');
      $scope.$apply();
    });
  };

  /**
    * @function '$scope.checkUserLocation'
    * @memberOf registerLogInLogOut
    * @description Logs out users who are inactive for a specific time interval;
  */


  $scope.userPreviousLocation = null;
  $scope.checkUserLocation = function() {
   if ( $scope.userPreviousLocation === null || $rootScope.loggedIn === false ) {
     $scope.userPreviousLocation = $rootScope.currentUserLoc;
     console.log('First time check user location');
   } else {
     console.log('Compare previousLocation and currentLocation');
     console.log('previousLocation', $scope.userPreviousLocation);
     console.log('currentLocation', $rootScope.currentUserLoc);
     if ( JSON.stringify($scope.userPreviousLocation) === JSON.stringify($rootScope.currentUserLoc) ) {
       console.log('Kick out inactive user');
       $scope.logOut();
     }
   }
 };

 setInterval($scope.checkUserLocation, 90000);
  /**
    * @function $scope.showPartial
    * @memberOf registerLogInLogOut
    * @description shows different partials (ng-view) depenending on user authentication (e.g. it shows Login page if user is not currently logged in; shows map, chat, and locations if user is logged in - even after page refresh)
  */
  $scope.showPartial = function() {
    $rootScope.showMessages = true;
  }
  /**
    * @function $scope.signUp
    * @memberOf registerLogInLogOut
    * @description controls the signup button if you are not logged in ($rootScope.attemptSignup is false). The function toggles the attemptSignup variable depending on the user's status (logged in or not)
  */
  // $rootScope.team = false;
  // $rootScope.attemptSignup = false;
  $scope.signUp = function () {
    console.log($rootScope.attemptSignup);
    $rootScope.attemptSignup = !$rootScope.attemptSignup;
    $location.path('/signup');
  }
  /**
    * @function databaseAndAuth.auth.onAuthStateChanged
    * @memberOf registerLogInLogOut
    * @description Native Firebase method that listens for any change in user authentication status. Every time user loads the page, goes to a different page, or clicks login/logout buttons this method is triggered and checks if the user is currently loged in. It makes use of the runListeners factory to ensure that any change in the database is properly registerd and acted upon. Takes a single parameter: databaseUser
    @param databaseUser if user is logged in, databaseUser will be truthy and will contain information about that user (from the database). This information is used to identify the user and attach their messages and location to their appropriate database entry (i.e. John's location will not be stored under Amy's database entry). If user is logged out, databaseUser will be falsy.
  */
  databaseAndAuth.auth.onAuthStateChanged(function(databaseUser) {
    if (databaseUser) {

      console.log('calling this function');
      localStorage.setItem('user', databaseUser);
      runListeners.initUsers();
      runListeners.childChanged();
      runListeners.childAdded();
      runListeners.childRemoved();
      runListeners.teamAssigned();
      $rootScope.loggedIn = true;
      $rootScope.userCredentials = {
        email: databaseUser.email
      }
      fetchMessages();
      getUsers();
      $rootScope.$broadcast('user:logIn', databaseUser.uid);
      $scope.userId = databaseUser.uid;
      //set the team if it doesn't already exist
      if (Object.keys(databaseAndAuth.users).length === 1) {
        console.log('should not run')
        var teamInit = {bool: true, red: 1, blue: 0};
        databaseAndAuth.database.ref('team').set(teamInit);
      }
      $scope.$apply();


    } else {
      $rootScope.loggedIn = false;
      $scope.$apply();
    }
  });
  /**
    * @class escapeEmailAddress
    * @description Creates an unique identifier for the database based on user email. The database does not allow keys with periods (.) so this function converts periods into commas. This allows us to find the user and update/delete their data (especially private messages) based on their email.
  */
  function escapeEmailAddress(email) {
    if (!email) return false
    email = email.toLowerCase();
    email = email.replace(/\./g, ',');
    return email;
  }
/**
  * @function $scope.changePassword
  * @memberOf registerLogInLogOut
  * @description Handles updating user passwords in profile dashboard using Firebase native method updatePassword().
*/
$scope.changePassword = function () {
  var user = firebase.auth().currentUser;
  console.log(user);
  var newPassword = $scope.newPassword;

  user.updatePassword(newPassword).then(function() {
    console.log('password changed!')
  }, function(error) {
    console.log('error');
  });
}
/**
  * @function getUsers
  * @description Fetches all the users from the database. Populates the dropdown messaging window (on the profile page)
*/
var getUsers = function () {
  var userRef =  firebase.database().ref('users');
  userRef.on('value', function(snapshot, prevChildKey){
    $rootScope.currentUsers = snapshot.val();
    $scope.$apply();
  })
}

/**
  * @function fetchMessages
  * @description Fetches all the private messages from the database for the logged in user.
*/
var fetchMessages = function () {
  var userRef = firebase.database().ref('privateMessages/' + escapeEmailAddress($rootScope.userCredentials.email));
  userRef.on('value', function (snapshot, prevChildKey) {
    $scope.privateMessages = snapshot.val();
    $scope.$apply();
  });
}

/**
  * @function showProfile
  * @description Shows the user profile of the currently logged in user (routing)
*/
  $scope.showProfile = function () {
    $rootScope.accessProfile = true;
    $location.path('/profile');
  }
});
