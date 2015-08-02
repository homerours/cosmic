// Search
angular.module('cosmic.controllers').controller('SearchCtrl', function($scope,$q, cosmicDB,cosmicConfig,cosmicPlayer,$ionicViewSwitcher,$state,$timeout,$ionicPopover,$cordovaToast) {
    $scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';

    // Focus on search
    $timeout(function(){
        var searchElement = angular.element(document.getElementById('search-input'));
        searchElement[0].focus();
        cordova.plugins.Keyboard.show();
    },150);

    $scope.$watch('search',function(){
        var search = $scope.search;
        if (search){
            $timeout(function(){
                searchInDB(search);
            }, 400);
        }

    });

    // Hide keyboard on enter
    $scope.hideKeyboard = function(){
        console.log('hideKeyboard');
        cordova.plugins.Keyboard.close();
    };

    $scope.playTitle = function (index){
        cosmicPlayer.loadPlaylist($scope.titles);
        cosmicPlayer.launchPlayer(index);
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('player');
    };

    var searchInDB = function(search){
        if (search == $scope.search && search.length>0){
            console.log('Search: '+search);
            cosmicDB.search(search).then(function(titles){
                $scope.titles = titles;
            });

        } else if (search.length === 0 ){
            $scope.titles = [];
        }
    };

    // Popover
    var selectedTitle;
    var event;
    $ionicPopover.fromTemplateUrl('templates/title-popover.html', {
        scope: $scope,
    }).then(function(popover) {
        $scope.popover = popover;
        $scope.showPopover = function(ev,title){
            ev.stopPropagation();
            event = ev;
            selectedTitle = title;
            popover.show(event);
        };

        // add the title to an existing playlist
        $scope.addToPlaylist = function(){
            console.log('add to playlist');
            popover.hide();
            $ionicPopover.fromTemplateUrl('templates/select-playlist-popover.html', {
                scope: $scope,
            }).then(function(playlistPopover) {
                // Get playlists
                cosmicDB.getPlaylistsNames().then(function(playlists){
                    $scope.playlists = playlists;
                    playlistPopover.show(event);
                    $scope.addTitleToPlaylist = function(playlistId){
                        console.log('add to playlist '+playlistId);
                        cosmicDB.addTitleToPlaylist(playlistId,selectedTitle.id).then(function(){
                            $cordovaToast.showShortTop('Done !');
                            playlistPopover.remove();
                        });
                    };
                });

            });

        };
        // Add the current title as next on the current playlist
        $scope.addNext = function(){
            console.log('select title : ');
            console.log(selectedTitle);
            cosmicPlayer.setNext(selectedTitle);
            popover.hide();
            $cordovaToast.showShortTop('Done !');
        };
    });
});


