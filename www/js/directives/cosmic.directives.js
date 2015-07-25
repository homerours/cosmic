angular.module('cosmic.directives').directive('playlistBar',function(cosmicPlayer, $ionicScrollDelegate,$location,$anchorScroll){
    return {
        restrict: 'E',
        templateUrl: 'templates/playlistBar.html',
        //transclude : true,
        scope: {
            player:'=',
            controls :'='
        },
        controller : function($scope,$ionicScrollDelegate,$location,$anchorScroll){
            var scrollToCurrentTitle=function(){
                var targetId='playBarTitle_'+cosmicPlayer.playlistIndex;
                console.log('Scrolling to '+targetId);
                //$location.hash(targetId);
                console.log('Hash');
                var delegate = $ionicScrollDelegate.$getByHandle('playlistBarScroll');
                //var pos= delegate.getScrollPosition();
                //console.log('Position: '+pos.left);
                delegate.scrollTo(cosmicPlayer.playlistIndex * 100,0,true);
            };
            setTimeout(function(){
                console.log('go timeout');
                $scope.$watch('player.playlistIndex',scrollToCurrentTitle);
                scrollToCurrentTitle();
            }, 1000);
            //scrollToCurrentTitle();
        }
        //link      : function (scope, element, attrs) {
        //scope.innerControls = scope.controls || {};
        //scope.innerControls.scrollToCurrentTitle = function(){

        //};
        //}
    };

});
