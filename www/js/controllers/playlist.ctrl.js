// Playlists
angular.module('cosmic.controllers').controller('PlaylistsCtrl', function($scope, cosmicPlayer, cosmicDB,$ionicActionSheet,$timeout,$ionicPopup,$cordovaToast,$rootScope) {

    cosmicDB.getPlaylists().then(function(playlists){
        $scope.playlists=playlists;
    });

    $scope.newPlaylist = function (){
        $scope.dataPopup={};
        var myPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="dataPopup.newPlaylistName">',
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
                    onTap: function(e) {
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
                    }
                }
            ]
        });
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

