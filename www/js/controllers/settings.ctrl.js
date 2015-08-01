// Settings
angular.module('cosmic.controllers').controller('SettingsCtrl', function($scope,$ionicPlatform,$cordovaSQLite,deviceFS,cosmicDB,$cordovaToast,cosmicConfig, imageService, onlineArtwork,$ionicPopup,$localstorage) {

    $scope.isSearchingArtworks = false;
    $scope.findMissingArtworks = function(){
        if ( ! $scope.isSearchingArtworks){
            $scope.isSearchingArtworks = true;
            cosmicDB.downloadMissingArtworks().then(function(){
                $cordovaToast.showShortTop('Finished !');
                console.log('Success itunes');
                $scope.isSearchingArtworks = false;
            },function(error){
                console.log(error);
                $scope.isSearchingArtworks = false;
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

    var startScan = function(){
        $scope.scan=null;
        console.log('start scan');
        deviceFS.scanMusicFolder().then(function(){
            $scope.scan=startScan;
        });
    };
    $scope.scan=startScan;

    $scope.notif= function(){
        $cordovaToast.showShortTop('Here is a message').then(function(success) {
        }, function (error) {
        });
        //$cordovaProgress.showText(false, 100000, "Loading");
    };

});


