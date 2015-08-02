// Playlist special
angular.module('cosmic.controllers').controller('PlaylistSpecialCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,$ionicGesture,cosmicConfig,$ionicPopover,$cordovaToast,$ionicListDelegate) {

    var playlistId=$stateParams.playlistId;
    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';

    var loadPlaylistContent = function(){
        cosmicDB.getSpecialPlaylist(playlistId,50).then(function(playlist){
            $scope.playlist=playlist.titles;
        });
    };
    loadPlaylistContent();

    $scope.playTitle = function (index){
        cosmicPlayer.loadPlaylist($scope.playlist);
        cosmicPlayer.launchPlayer(index);
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };



});




