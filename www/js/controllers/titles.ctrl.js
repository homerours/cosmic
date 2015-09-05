// Titles
angular.module('cosmic.controllers').controller('TitlesCtrl', function($scope, $stateParams, $state,cosmicDB,cosmicPlayer,$ionicViewSwitcher,$ionicPopover,$cordovaToast,cosmicConfig,$localstorage) {

	$scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';
	var artistId=$stateParams.artistId;

	// Get artist titles
	cosmicDB.getTitles(artistId).then(function(data){
		$scope.titles=data.titles;
		$scope.playlist=data.playlist;
	});

	// Start playing titles
    $scope.playTitle = function (title){
        cosmicPlayer.loadPlaylist($scope.playlist);
        cosmicPlayer.launchPlayer(title);
        if ($localstorage.get('goToPlayer','true') === 'true'){
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('player');
        }
    };

	// Popover
	var selectedTitle;
	var event;
	$scope.showPopover = function(ev,title){
		ev.stopPropagation();
		event = ev;
		selectedTitle = title;

		$ionicPopover.fromTemplateUrl('templates/title-popover.html', {
			scope: $scope,
		}).then(function(popover) {
			$scope.popover = popover;
			popover.show(event);

			// add the title to an existing playlist
			$scope.addToPlaylist = function(){
				console.log('add to playlist');
				popover.hide();
				$ionicPopover.fromTemplateUrl('templates/select-playlist-popover.html', {
					scope: $scope,
				}).then(function(popover) {
					// Get playlists
					cosmicDB.getPlaylistsNames().then(function(playlists){
						$scope.playlists = playlists;
						$scope.popover =popover;
						popover.show(event);
						$scope.addTitleToPlaylist = function(playlistId){
							console.log('add to playlist '+playlistId);
							cosmicDB.addTitleToPlaylist(playlistId,selectedTitle.id).then(function(){
								$cordovaToast.showShortTop('Done !');
								popover.hide();
							});
						};
					});

				});

			};
			// Add the current title as next on the current playlist
			$scope.addNext = function(){
				cosmicPlayer.setNext(selectedTitle);
				popover.hide();
				$cordovaToast.showShortTop('Done !');
			};
		});
	};


	var destroy = true;
	$scope.$on('popover.hidden', function(){
		console.log('destroyPopover');
		if (destroy){
			destroy = false;
			$scope.popover.remove().then(function(){
				$scope.popover = null;
				destroy = true;
			});
		}
	});
});


