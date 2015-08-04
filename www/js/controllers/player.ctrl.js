// Player
angular.module('cosmic.controllers').controller('PlayerCtrl', function($scope,cosmicPlayer,$ionicHistory,$ionicGesture,$ionicViewSwitcher) {

    $scope.player=cosmicPlayer;

    // Swipe down to go back
    var playerContainer=angular.element(document.getElementById('player'));
    $ionicGesture.on('swipedown',function(e){
        $ionicViewSwitcher.nextDirection('back');
        $ionicHistory.goBack(-1);
    }, playerContainer);
    console.log($scope.player.loop);
});


