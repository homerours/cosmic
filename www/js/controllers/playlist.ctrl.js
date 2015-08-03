// Playlists
angular.module('cosmic.controllers').controller('PlaylistsCtrl', function($scope, cosmicDB, $ionicPopup,$cordovaToast, cosmicConfig) {

    // For popover styling
    document.body.classList.remove('platform-ios');
    document.body.classList.remove('platform-android');
    document.body.classList.remove('platform-ionic');
    document.body.classList.add('platform-ionic');


    // Refresh view
    var refreshData = function(){

        $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
        cosmicDB.getSpecialPlaylists(8).then(function(specialPlaylists){
            $scope.specialPlaylists = specialPlaylists;
        });
        cosmicDB.getPlaylists().then(function(playlists){
            $scope.playlists=playlists;
        });
    };

    // Refresh view on entering on the view
    $scope.$on('$ionicView.enter', function() {
        console.log('Refresh data');
        refreshData();
    });

    // New playlist popup
    $scope.newPlaylist = function (){
        console.log('new playlist');
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
                    onTap: $scope.submitNewPLaylist
                }
            ]
        });
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
    };


});

