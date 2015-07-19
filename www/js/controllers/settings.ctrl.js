// Settings
angular.module('cosmic.controllers').controller('SettingsCtrl', function($scope,$ionicPlatform,deviceFS,cosmicDB) {
    $ionicPlatform.ready(function() {
        $scope.flush= function(){
            console.log('Flush database');
            cosmicDB.flushDatabase();
        };
        $scope.scan= function(){
            console.log('start scan');
            deviceFS.startScan();
        };
    });

});


