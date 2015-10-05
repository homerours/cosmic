// Playlists
angular.module('cosmic.controllers').controller('PlaylistsCtrl', function($scope, cosmicDB, $ionicPopup,$cordovaToast, cosmicConfig,cosmicPlayer,$ionicPopover,$ionicViewSwitcher,$state,$localstorage) {

	$scope.miniaturesPath = cosmicConfig.appRootStorage + 'miniatures/';

	// Refresh view
	function refreshData(){
		cosmicDB.getSpecialPlaylists(8).then(function(specialPlaylists){
			$scope.specialPlaylists = specialPlaylists;
		});
		cosmicDB.getPlaylists().then(function(playlists){
			$scope.playlists=playlists;
		});
	}

	$scope.$on('$ionicView.beforeEnter', function() {
		refreshData();
	});

	// New playlist popup
	$scope.newPlaylist = function (){
		console.log('new playlist');
		// submit new playlist
		$scope.submitNewPlaylist = function(){
			//console.log('hideKeyboard');
			cordova.plugins.Keyboard.close();
			var newPlaylistName = $scope.dataPopup.newPlaylistName;
			if (newPlaylistName===''){
				$cordovaToast.showShortTop('Playlist name can not be empty !');
			} else {
				myPopup.close();
				cosmicDB.addPlaylist(newPlaylistName).then(function(res){
					$cordovaToast.showShortTop('Playlist created !');
					cosmicDB.getPlaylists().then(function(playlists){
						$scope.playlists=playlists;
					});
				},function(err){
					$cordovaToast.showShortTop('Error : '+ err);
				});
			}
		};

		$scope.dataPopup={};
		var myPopup = $ionicPopup.show({
			template: '<form ng-submit="submitNewPlaylist()"><input type="text" ng-model="dataPopup.newPlaylistName"></form>',
			title: 'New playlist',
			subTitle: "Enter the playlist's name",
			scope: $scope,
			buttons: [
			{ text: 'Cancel',
				onTap: function(e){
					myPopup.close();
				}
			},
			{
				text: '<b>Save</b>',
				type: 'button-positive',
				onTap: $scope.submitNewPlaylist
			}
			]
		});
	};

	// Popover
	setTimeout(function() {
		document.body.classList.remove('platform-ios');
		document.body.classList.remove('platform-android');
		document.body.classList.remove('platform-ionic');
		document.body.classList.add('platform-ionic');
	}, 500);

	var selectedPlaylist;
	var event;
	$scope.showPopover = function(ev,playlist){
		ev.preventDefault();
		event = ev;
		selectedPlaylist = playlist;

		$ionicPopover.fromTemplateUrl('templates/playlist-popover.html', {
			scope: $scope,
		}).then(function(popover) {
			$scope.popover = popover;
			popover.show(event);

			// Start playing the selected playlist
			$scope.startPlaylist = function(){
				console.log('Start playing playlist');
				cosmicDB.getPlaylistItems(selectedPlaylist.id).then(function(playlist){
					cosmicPlayer.loadPlaylist(playlist);
					cosmicPlayer.launchPlayerByIndex(0); // Start at first title
					if ($localstorage.get('goToPlayer','true') === 'true'){
						$ionicViewSwitcher.nextDirection('forward');
						$state.go('player');
					}
				});
				$scope.popover.hide();

			};
			// Delete playlist
			$scope.deletePlaylist = function(){
				console.log('Delete Playlist');
				cosmicDB.deletePlaylist(selectedPlaylist.id).then(function(){
					$cordovaToast.showShortTop('Playlist Deleted');
					refreshData();
				});
				$scope.popover.hide();
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
