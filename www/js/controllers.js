var cosmicMobileControllers=angular.module('cosmic.controllers', []);

// Playlists
cosmicMobileControllers.controller('PlaylistsCtrl', function($scope,cosmicPlayer) {

});

// Artists
cosmicMobileControllers.controller('ArtistsCtrl', function($scope,$q, cosmicDB) {
    cosmicDB.getArtists().then(function(artists){
        $scope.artists=artists;
    });
});

// Titles
cosmicMobileControllers.controller('TitlesCtrl', function($scope, $stateParams,cosmicDB) {
    var artistId=$stateParams.artistId;
    cosmicDB.getTitles(artistId).then(function(albums){
        console.log(JSON.stringify(albums));
        $scope.albums=albums;
    });
});

// Player
cosmicMobileControllers.controller('PlayerCtrl', function($scope,cosmicPlayer) {
    $scope.player=cosmicPlayer;
    $scope.player.initAndPlay();
});

// Settings
cosmicMobileControllers.controller('SettingsCtrl', function($scope,$ionicPlatform,$fileFactory,cosmicDB) {
    var fs = new $fileFactory();
    $ionicPlatform.ready(function() {
        $scope.flush= function(){
            console.log('Flush database');
            cosmicDB.flushDatabase();
        };
        $scope.scan= function(){
            console.log('start scan');
            fs.startScan();
        };
        fs.getEntriesAtRoot().then(function(result) {
            $scope.files = result;
        }, function(error) {
            console.error(error);
        });

        $scope.getContents = function(path) {
            fs.getEntries(path).then(function(result) {
                $scope.files = result;
                $scope.files.unshift({name: "[parent]"});
                fs.getParentDirectory(path).then(function(result) {
                    result.name = "[parent]";
                    $scope.files[0] = result;
                });
            });
        };
    });

});


//cosmicMobileControllers.controller('PlayerCtrl', ['$scope', '$rootScope', 'cosmicPlayer', '$window',
//function($scope, $rootScope, player, $window) {
////$scope.deviceSize = $window.width;
//$rootScope.player = player;
//$rootScope.backText = '';
//$rootScope.header = 'Now playing';
//$rootScope.showBack = true;
//$scope.seek = function($event) {
////console.log(simpleKeys($event));
//var current_percent = $event.clientX / $event.currentTarget.offsetWidth;
//player.seek(current_percent);
//};
//}]);

