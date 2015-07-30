// Playlist-items
angular.module('cosmic.controllers').controller('PlaylistItemsCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,$ionicGesture,cosmicConfig) {

    var playlistId=$stateParams.playlistId;
    console.log('playlist itm ctrl '+ playlistId);
    cosmicDB.getPlaylistItems(playlistId).then(function(playlist){
        $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';

        console.log(playlist);
        $scope.playlist=playlist;
    });

    $scope.playTitle = function (index){
        cosmicPlayer.launchPlayer(index);
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };


});



