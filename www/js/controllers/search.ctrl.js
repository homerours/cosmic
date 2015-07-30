// Search
angular.module('cosmic.controllers').controller('SearchCtrl', function($scope,$q, cosmicDB,cosmicConfig,cosmicPlayer,$ionicViewSwitcher,$state,$timeout) {
    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';

    $scope.$watch('search',function(){
        var search = $scope.search;
        $timeout(function(){
            searchInDB(search);
        }, 400);

    });

    $scope.playTitle = function (index){
        cosmicPlayer.loadPlaylist($scope.titles);
        cosmicPlayer.launchPlayer(index);
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };

    var searchInDB = function(search){
        if (search == $scope.search){
            console.log('Search: '+search);
            cosmicDB.search(search).then(function(titles){
                $scope.titles = titles;
            });

        }
    };

});


