// Player
angular.module('cosmic.controllers').controller('PlayerCtrl', function($scope,$stateParams,cosmicPlayer,$ionicHistory,$ionicGesture,$ionicViewSwitcher) {
    console.log('load Player Ctrl');

    $scope.playlistBarControls = {};
    var onUpdate = function(position){
        $scope.position=position;
        if ($scope.duration>0){
            $scope.progress=100*($scope.position / $scope.duration);
        } else {
            $scope.progress=0;
        }
    };
    var onNewTitle = function(){
        $scope.player=cosmicPlayer;
        console.log(cosmicPlayer.playlist);
        $scope.position=0;
        $scope.progress=0;
        cosmicPlayer.getDuration().then(function(duration){
            $scope.duration=duration;
        });
    };
    onNewTitle();
    cosmicPlayer.setOnUpdate(onUpdate);
    cosmicPlayer.setOnTitleChange(onNewTitle);
    $scope.seek = function($event) {
        var current_percent = $event.clientX / $event.currentTarget.offsetWidth;
        $scope.progress=current_percent;
        cosmicPlayer.seek(current_percent);
    };

    var playerContainer=angular.element(document.getElementById('player'));
    $ionicGesture.on('swiperight',function(e){
        //console.dir($ionicHistory.viewHistory());
        $ionicViewSwitcher.nextDirection('back');
        $ionicHistory.goBack(-1);
    }, playerContainer);
});


