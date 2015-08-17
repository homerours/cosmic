// Playlist-items
angular.module('cosmic.controllers').controller('PlaylistItemsCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,cosmicConfig,$ionicPopover,$cordovaToast,$localstorage) {

    var playlistId=$stateParams.playlistId;
    $scope.playlistName=$stateParams.playlistName;
    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';

    // Load playlist titles
    var loadPlaylistContent = function(){
        cosmicDB.getPlaylistItems(playlistId).then(function(playlist){
            $scope.playlist=playlist;
        });
    };
    loadPlaylistContent();

    // Start playing playlist
    $scope.playTitle = function (title){
        cosmicPlayer.loadPlaylist($scope.playlist);
        cosmicPlayer.launchPlayer(title);
        if ($localstorage.get('goToPlayer','true') === 'true'){
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('player');
        }
    };

    $scope.playPlaylist = function(mode){
        cosmicPlayer.loadPlaylist($scope.playlist);
        if (mode === 'shuffle'){
            cosmicPlayer.shufflePlaylist();
        }
        cosmicPlayer.launchPlayer(cosmicPlayer.playlist[0]);
        if ($localstorage.get('goToPlayer','true') === 'true'){
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('player');
        }
    };

    // Popover
    var selectedTitle;
    var event;
    $scope.showPopover = function(ev,title){
        ev.stopPropagation();
        event = ev;
        selectedTitle = title;
        $ionicPopover.fromTemplateUrl('templates/playlist-item-popover.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
            popover.show(event);

            // Remove the song from the playlist
            $scope.removeFromPlaylist = function(){
                $scope.popover.hide();
                cosmicDB.removeTitleFromPlaylist(playlistId,selectedTitle.position).then(function(){
                    loadPlaylistContent();
                    $cordovaToast.showShortTop('Done !');
                });
            };
            // Add the current title as next on the current playlist
            $scope.addNext = function(){
                cosmicPlayer.setNext(selectedTitle);
                $scope.popover.hide();
                $cordovaToast.showShortTop('Done !');
            };
        });
    };

    var destroy = true;
    $scope.$on('popover.hidden', function(){
        console.log('destroyPopover');
        if (destroy){
            destroy = false;
            $scope.popover.remove().then(function(){
                $scope.popover = null;
                destroy = true;
            });
        }
    });

});



