angular.module('cosmic.directives').directive('playlistBar',function($ionicScrollDelegate,$timeout){
    return {
        restrict: 'E',
        templateUrl: 'templates/playlistBar.html',
        scope: {
            player:'='
        },
        controller : function($scope,$ionicScrollDelegate){
            var scrollToCurrentTitle=function(){
                var delegate = $ionicScrollDelegate.$getByHandle('playlistBarScroll');
                delegate.scrollTo($scope.player.playlistIndex * 100,0,true);
            };
            $timeout(function(){
                $scope.$watch('player.playlistIndex',scrollToCurrentTitle);
                scrollToCurrentTitle();
            }, 700);
        }
    };

});

angular.module('cosmic.directives').directive('playBar',function($state,$ionicViewSwitcher){
    return {
        restrict: 'E',
        templateUrl: 'templates/playBar.html',
        scope: {
            player:'='
        },
        controller : function($scope){
            $scope.openPlayer=function(){
                $ionicViewSwitcher.nextDirection('forward');
                $state.go('player');
            };
        }
    };

});
