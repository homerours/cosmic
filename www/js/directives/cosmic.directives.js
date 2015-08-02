angular.module('cosmic.directives').directive('playlistBar',function($ionicScrollDelegate,$timeout,cosmicConfig){
    return {
        restrict: 'E',
        templateUrl: 'templates/playlistBar.html',
        scope: {
            player:'='
        },
        controller : function($scope,$ionicScrollDelegate){
            $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
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

angular.module('cosmic.directives').directive('playBar',function($state,$ionicViewSwitcher,cosmicConfig,cosmicPlayer){
    return {
        restrict: 'E',
        templateUrl: 'templates/playBar.html',
        scope: {
        },
        controller : function($scope){
            $scope.player = cosmicPlayer;
            $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
            $scope.openPlayer=function(){
                $ionicViewSwitcher.nextDirection('forward');
                $state.go('player');
            };
        }
    };

});

angular.module('cosmic.directives').directive('artworkMosaic',function($state,cosmicConfig){
    return {
        restrict: 'A',
        templateUrl: 'templates/artwork-mosaic.html',
        scope: {
            title : "@",
            songs : "="
        },
        controller : function($scope){
            $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
        }
    };

});

