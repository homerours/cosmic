// Titles
angular.module('cosmic.controllers').controller('TitlesCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer) {
    var artistId=$stateParams.artistId;
    cosmicDB.getTitles(artistId).then(function(albums){
        $scope.albums=albums;
    });
    $scope.playTitle = function (index){
        cosmicPlayer.launchPlayer(index);
        $state.go('player');
    };
});


