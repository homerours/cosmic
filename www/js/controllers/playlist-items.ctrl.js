// Playlist-items
angular.module('cosmic.controllers').controller('PlaylistItemsCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,cosmicConfig,$ionicPopover,$cordovaToast) {

    var playlistId=$stateParams.playlistId;
    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';

    // Load playlist titles
    var loadPlaylistContent = function(){
        cosmicDB.getPlaylistItems(playlistId).then(function(playlist){
            $scope.playlist=playlist;
        });
    };
    loadPlaylistContent();

    // Start playing playlist
    $scope.playTitle = function (index){
        cosmicPlayer.loadPlaylist($scope.playlist);
        cosmicPlayer.launchPlayer(index);
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };

    // Popover
    var selectedTitle;
    var event;
    $ionicPopover.fromTemplateUrl('templates/playlist-item-popover.html', {
        scope: $scope,
    }).then(function(popover) {
        $scope.popover = popover;
        $scope.showPopover = function(ev,title){
            ev.stopPropagation();
            event = ev;
            selectedTitle = title;
            popover.show(event);
        };

        // Remove the song from the playlist
        $scope.removeFromPlaylist = function(){
            popover.hide();
            cosmicDB.removeTitleFromPlaylist(playlistId,selectedTitle.position).then(function(){
                loadPlaylistContent();
                $cordovaToast.showShortTop('Done !');
            });
        };
        // Add the current title as next on the current playlist
        $scope.addNext = function(){
            cosmicPlayer.setNext(selectedTitle);
            popover.hide();
            $cordovaToast.showShortTop('Done !');
        };
    });


});



