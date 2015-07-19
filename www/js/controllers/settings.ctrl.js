// Settings
angular.module('cosmic.controllers').controller('SettingsCtrl', function($scope,$ionicPlatform,deviceFS,cosmicDB,$cordovaToast) {
    $ionicPlatform.ready(function() {
        $scope.flush= function(){
            console.log('Flush database');
            cosmicDB.flushDatabase();
        };
        $scope.scan= function(){
            console.log('start scan');
            deviceFS.startScan();
        };
        $scope.notif= function(){
            $cordovaToast.showShortTop('Here is a message').then(function(success) {
            }, function (error) {
            });
            //$cordovaProgress.showText(false, 100000, "Loading");
        };
    });

});


