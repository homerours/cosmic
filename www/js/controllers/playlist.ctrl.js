// Playlists
angular.module('cosmic.controllers').controller('PlaylistsCtrl', function($scope, cosmicPlayer, cosmicDB,$ionicActionSheet,$timeout,$ionicPopup,$cordovaToast,$rootScope, cosmicConfig,$cordovaStatusbar) {

    document.body.classList.remove('platform-ios');
    document.body.classList.remove('platform-android');
    document.body.classList.remove('platform-ionic');
    document.body.classList.add('platform-ionic');


    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
    cosmicDB.getPlaylists().then(function(playlists){
        $scope.playlists=playlists;
    });

    // New playlist popup
    $scope.newPlaylist = function (){
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


    $scope.show= function() {
        $ionicActionSheet.show({
            buttons: [
                { text: 'Complete' }
            ],
            destructiveText: 'Delete',
            titleText: 'Update Todo',
            cancelText: 'Cancel',
            buttonClicked: function(index) {
                return true;
            }
        });

    };

    $scope.player = cosmicPlayer;
});

