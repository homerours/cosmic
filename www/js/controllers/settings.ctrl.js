// Settings
angular.module('cosmic.controllers').controller('SettingsCtrl', function($scope,$ionicPlatform,deviceFS,cosmicDB,$cordovaToast) {
    $ionicPlatform.ready(function() {
        $scope.flush= function(){
            console.log('Flush database');
            cosmicDB.removeAllArtworks().then(function(){
                cosmicDB.flushDatabase();
                $cordovaToast.showShortTop('Database cleared !');
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

});


