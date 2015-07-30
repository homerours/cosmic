// Artists
angular.module('cosmic.controllers').controller('ArtistsCtrl', function($scope,$q, cosmicDB,cosmicConfig) {
    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
    cosmicDB.getArtists().then(function(artists){
        $scope.artists=artists;
    });
    $scope.doRefresh =function(){
        cosmicDB.getArtists().then(function(artists){
            $scope.artists=artists;
            $scope.$broadcast('scroll.refreshComplete');
        });

    };
});

