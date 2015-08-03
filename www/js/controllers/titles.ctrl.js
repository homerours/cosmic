// Titles
angular.module('cosmic.controllers').controller('TitlesCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,$ionicGesture,$ionicPopover,$cordovaToast,cosmicConfig) {

    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
    var artistId=$stateParams.artistId;

    // Get artist titles
    cosmicDB.getTitles(artistId).then(function(data){
        $scope.albums=data.albums;
        $scope.playlist=data.playlist;
    });
    // Start playing titles
    $scope.playTitle = function (index){
        cosmicPlayer.loadPlaylist($scope.playlist);
        cosmicPlayer.launchPlayer(index);
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };

    // Go to player
    var titlesView=angular.element(document.getElementById('titles-view'));
    $ionicGesture.on('swipeleft',function(e){
        console.log('Swipe left');
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    }, titlesView);


    // Popover
    document.body.classList.remove('platform-ios');
    document.body.classList.remove('platform-android');
    document.body.classList.remove('platform-ionic');
    document.body.classList.add('platform-ionic');
    var selectedTitle;
    var event;
    $ionicPopover.fromTemplateUrl('templates/title-popover.html', {
        scope: $scope,
    }).then(function(popover) {
        $scope.popover = popover;
        $scope.showPopover = function(ev,title){
            ev.stopPropagation();
            event = ev;
            selectedTitle = title;
            popover.show(event);
        };

        // add the title to an existing playlist
        $scope.addToPlaylist = function(){
            console.log('add to playlist');
            popover.hide();
            $ionicPopover.fromTemplateUrl('templates/select-playlist-popover.html', {
                scope: $scope,
            }).then(function(playlistPopover) {
                // Get playlists
                cosmicDB.getPlaylistsNames().then(function(playlists){
                    $scope.playlists = playlists;
                    playlistPopover.show(event);
                    $scope.addTitleToPlaylist = function(playlistId){
                        console.log('add to playlist '+playlistId);
                        cosmicDB.addTitleToPlaylist(playlistId,selectedTitle.id).then(function(){
                            $cordovaToast.showShortTop('Done !');
                            playlistPopover.remove();
                        });
                    };
                });

            });

        };
        // Add the current title as next on the current playlist
        $scope.addNext = function(){
            console.log('select title : ');
            console.log(selectedTitle);
            cosmicPlayer.setNext(selectedTitle);
            popover.hide();
            $cordovaToast.showShortTop('Done !');
        };
    });

});


