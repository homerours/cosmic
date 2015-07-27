// Playlists
angular.module('cosmic.controllers').controller('PlaylistsCtrl', function($scope, cosmicPlayer, cosmicDB) {

    cosmicDB.getPlaylists().then(function(playlists){
        $scope.playlists=playlists;
    });
    $scope.player = cosmicPlayer;
});

