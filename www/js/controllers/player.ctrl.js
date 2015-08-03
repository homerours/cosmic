// Player
angular.module('cosmic.controllers').controller('PlayerCtrl', function($scope,$stateParams,cosmicPlayer,$ionicHistory,$ionicGesture,$ionicViewSwitcher,cosmicConfig) {

    var blurElement    = document.getElementById("blur");
    var artworkElement = angular.element(document.getElementById("artwork"));
    var windowWidth    = artworkElement[0].clientWidth;

    $scope.artworksPath = cosmicConfig.appRootStorage + 'artworks/';
    $scope.playlistBarControls = {};
    var onUpdate = function(position){
        $scope.position=position;
        if ($scope.duration>0){
            setProgress(windowWidth * ($scope.position / $scope.duration));
        } else {
            setProgress(0);
        }
    };
    function setProgress(width){
        blurElement.style.width=windowWidth-width +'px';
    }
    var onNewTitle = function(){
        $scope.player=cosmicPlayer;
        console.log(cosmicPlayer.playlist);
        $scope.position=0;
        setProgress(0);
        cosmicPlayer.getDuration().then(function(duration){
            $scope.duration=duration;
        });
    };
    onNewTitle();
    cosmicPlayer.setOnUpdate(onUpdate);
    cosmicPlayer.setOnTitleChange(onNewTitle);

    $ionicGesture.on('dragleft dragright', function (event) {
        $scope.progress = event.gesture.center.pageX / windowWidth;
        $scope.position = $scope.progress * $scope.duration;
        setProgress(event.gesture.center.pageX);
    }, artworkElement);

    $ionicGesture.on('dragstart', function () {
        console.log('dragSTART');
        if (cosmicPlayer.playing){
            cosmicPlayer.stopWatchTime();
            cosmicPlayer.media.pause();
        }
    }, artworkElement);
    $ionicGesture.on('dragend', function () {
        console.log('dragEND');
        cosmicPlayer.seek($scope.progress);
        if (cosmicPlayer.playing){
            cosmicPlayer.startWatchTime();
            cosmicPlayer.media.play();
        }
    }, artworkElement);

    //$scope.seek = function($event) {
    //var current_percent = $event.clientX / $event.currentTarget.offsetWidth;
    //$scope.progress=current_percent;
    //cosmicPlayer.seek(current_percent);
    //};

    var playerContainer=angular.element(document.getElementById('player'));
    $ionicGesture.on('swipedown',function(e){
        //console.dir($ionicHistory.viewHistory());
        $ionicViewSwitcher.nextDirection('back');
        $ionicHistory.goBack(-1);
    }, playerContainer);
});


