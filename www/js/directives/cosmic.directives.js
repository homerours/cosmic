angular.module('cosmic.directives').directive('playlistBar',function(cosmicPlayer){
    return {
        restrict: 'E',
        templateUrl: 'templates/playlistBar.html',
        //transclude : true,
        scope: {
            player:'='
        },
        link : function (scope,element,attrs){
            //scope.playlist=cosmicPlayer.playlist;
        }
    };

});
