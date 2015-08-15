// Artists
angular.module('cosmic.controllers').controller('ArtistsCtrl', function($scope,$q, cosmicDB,cosmicConfig) {
    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
    // Get artists
    cosmicDB.getArtists().then(function(artists){
        $scope.artists=artists;
    });
    $scope.refreshArtists = function() {
        cosmicDB.getArtists().then(function(artists){
            $scope.artists=artists;
            $scope.$broadcast('scroll.refreshComplete');
        });
    };
});

