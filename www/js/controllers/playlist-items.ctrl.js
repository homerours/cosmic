// Playlist-items
angular.module('cosmic.controllers').controller('PlaylistItemsCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,$ionicGesture) {

    var playlistId=$stateParams.playlistId;
    cosmicDB.getPlaylistItems(playlistId).then(function(playlist){
        $scope.playlist=playlist;
    });

    $scope.playTitle = function (index){
        cosmicPlayer.launchPlayer(index);
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };

    //var titlesView=angular.element(document.getElementById('titles-view'));
    //$ionicGesture.on('swipeleft',function(e){
        //console.log('Swipe left');
        //$ionicViewSwitcher.nextDirection('forward');
        //$state.go('player');
    //}, titlesView);

    //$ionicGesture.on('swiperight',function(e){
        //console.log('Swipe right');
        //$ionicViewSwitcher.nextDirection('back');
        //$state.go('tab.artists');
    //}, titlesView);

});



