// Titles
angular.module('cosmic.controllers').controller('TitlesCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,$ionicGesture) {
    var artistId=$stateParams.artistId;
    cosmicDB.getTitles(artistId).then(function(albums){
        $scope.albums=albums;
    });
    $scope.playTitle = function (index){
        cosmicPlayer.launchPlayer(index);
        //$ionicViewSwitcher.nextTransition('ios');
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };

    var titlesView=angular.element(document.getElementById('titles-view'));
    $ionicGesture.on('swipeleft',function(e){
        console.log('Swipe left');
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    }, titlesView);

    //$ionicGesture.on('swiperight',function(e){
        //console.log('Swipe right');
        //$ionicViewSwitcher.nextDirection('back');
        //$state.go('tab.artists');
    //}, titlesView);

});


