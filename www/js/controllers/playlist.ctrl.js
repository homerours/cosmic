// Playlists
angular.module('cosmic.controllers').controller('PlaylistsCtrl', function($scope, cosmicDB, $ionicPopup,$cordovaToast, cosmicConfig,cosmicPlayer,$ionicPopover,$ionicViewSwitcher,$state) {

    // Refresh view
    function refreshData(){

        $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
        cosmicDB.getSpecialPlaylists(8).then(function(specialPlaylists){
            $scope.specialPlaylists = specialPlaylists;
        });
        cosmicDB.getPlaylists().then(function(playlists){
            $scope.playlists=playlists;
        });
    }

    // Refresh view on entering on the view
    $scope.$on('$ionicView.enter', function() {
        console.log('Refresh data');
        refreshData();
    });

    // New playlist popup
    $scope.newPlaylist = function (){
        console.log('new playlist');
        // submit new playlist
        $scope.submitNewPlaylist = function(){
            console.log('hideKeyboard');
            cordova.plugins.Keyboard.close();
            var newPlaylistName = $scope.dataPopup.newPlaylistName;
            if (newPlaylistName===''){
                $cordovaToast.showShortTop('Playlist name can not be empty !');
            } else {
                console.log('New playlist : '+ newPlaylistName);
                myPopup.close();
                cosmicDB.addPlaylist(newPlaylistName).then(function(res){
                    $cordovaToast.showShortTop('Playlist created !');
                    cosmicDB.getPlaylists().then(function(playlists){
                        $scope.playlists=playlists;
                    });
                },function(err){
                    $cordovaToast.showShortTop('Error : '+ err);
                });
            }
        };

        $scope.dataPopup={};
        var myPopup = $ionicPopup.show({
            template: '<form ng-submit="submitNewPlaylist()"><input type="text" ng-model="dataPopup.newPlaylistName"></form>',
            title: 'New playlist',
            subTitle: "Enter the playlist's name",
            scope: $scope,
            buttons: [
                { text: 'Cancel',
                    onTap: function(e){
                        myPopup.close();
                    }
                },
                {
                    text: '<b>Save</b>',
                    type: 'button-positive',
                    onTap: $scope.submitNewPlaylist
                }
            ]
        });
    };

    // Popover
    setTimeout(function() {
        document.body.classList.remove('platform-ios');
        document.body.classList.remove('platform-android');
        document.body.classList.remove('platform-ionic');
        document.body.classList.add('platform-ionic');
    }, 500);
    var selectedPlaylist;
    var event;
    $ionicPopover.fromTemplateUrl('templates/playlist-popover.html', {
        scope: $scope,
    }).then(function(popover) {
        $scope.popover = popover;
        $scope.showPopover = function(ev,playlist){
            //ev.stopPropagation();
            ev.preventDefault();
            event = ev;
            selectedPlaylist = playlist;
            popover.show(event);
        };

        // Start playing the selected playlist
        $scope.startPlaylist = function(){
            console.log('Start playing playlist');
            cosmicDB.getPlaylistItems(selectedPlaylist.id).then(function(playlist){
                cosmicPlayer.loadPlaylist(playlist);
                cosmicPlayer.launchPlayerByIndex(0); // Start at first title
                $ionicViewSwitcher.nextDirection('forward');
                $state.go('player');
            });
            popover.hide();

        };
        // Delete playlist
        $scope.deletePlaylist = function(){
            console.log('Delete Playlist');
            cosmicDB.deletePlaylist(selectedPlaylist.id).then(function(){
                $cordovaToast.showShortTop('Playlist Deleted');
                refreshData();
            });
            popover.hide();
        };
    });

});

