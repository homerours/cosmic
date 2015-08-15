// Settings
angular.module('cosmic.controllers').controller('SettingsCtrl', function($scope,cosmicDB,$cordovaToast, $ionicPopup,$localstorage, $cordovaStatusbar) {

    $scope.isSearchingArtworks = false;
    $scope.isSearchingArtists = false;

    $scope.config = {showStatusBar : ($localstorage.get('showStatusBar','true') === 'true'), goToPlayer : ($localstorage.get('goToPlayer','true') === 'true')};

    // Hide/show status bar
    $scope.toggleStatusBar = function(){
        $localstorage.set('showStatusBar',$scope.config.showStatusBar);
        if ($scope.config.showStatusBar) {
            $cordovaStatusbar.show();
        } else {
            $cordovaStatusbar.hide();
        }
    };
    // Go to player on play
    $scope.toggleGoToPlayer = function(){
        $localstorage.set('goToPlayer',$scope.config.goToPlayer);
    };

    // Find missing album covers
    $scope.findMissingArtworks = function(){
        if ( ! $scope.isSearchingArtworks){
            $scope.isSearchingArtworks = true;
            cosmicDB.downloadMissingArtworks().then(function(nbArtworks){
                $scope.isSearchingArtworks = false;
                $cordovaToast.showShortTop('Downloaded '+nbArtworks+' new album covers !');
                console.log('Success itunes');
            },function(error){
                console.log(error);
                $scope.isSearchingArtworks = false;
            });
        }
    };
    // Find artists names
    $scope.findArtistNames = function(){
        if ( ! $scope.isSearchingArtists){
            $scope.isSearchingArtists = true;
            cosmicDB.correctArtistNames().then(function(nbArtists){
                $scope.isSearchingArtists = false;
                $cordovaToast.showShortTop('Correctes '+nbArtists+' names !');
                console.log('Success itunes');
            },function(error){
                console.log(error);
                $scope.isSearchingArtists = false;
            });
        }
    };

    // Clear Database
    $scope.clearAllDatabase = function(){

        var confirmPopup = $ionicPopup.confirm({
            title: 'Clear Database',
            template: 'Are you sure you want to remove all data from this app ?',
            okText : 'Delete',
            okType : 'button-assertive'
        });
        confirmPopup.then(function(res) {
            if(res) {
                // Delete all data
                console.log('Clear database');
                cosmicDB.removeAllArtworks().then(function(){
                    console.log('Artworks removed');
                    cosmicDB.flushDatabase().then(function(){
                        console.log('Database cleared');
                        $localstorage.clear();
                        $cordovaToast.showShortTop('Database cleared !');
                    },function(err){
                        console.error(err);
                    });
                });
            } else {
            }
        });

    };


});


