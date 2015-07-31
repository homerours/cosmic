// Settings
angular.module('cosmic.controllers').controller('SettingsCtrl', function($scope,$ionicPlatform,$cordovaSQLite,deviceFS,cosmicDB,$cordovaToast,cosmicConfig, imageService, onlineArtwork) {
    $ionicPlatform.ready(function() {
        $scope.miniature= function(){
            console.log('Make miniature!');
            $cordovaSQLite.execute(cosmicDB.db, "SELECT file_name FROM artwork WHERE id>1",[]).then(function(res){
                for (var i=0; i < res.rows.length; ++i){
                    imageService.makeMiniature(res.rows.item(i).file_name);
                }
            });
        };
        $scope.findAlbumCovers = function(){
            cosmicDB.downloadMissingArtworks().then(function(){
                console.log('Success itunes');

            },function(error){
                console.log(error);

            });


        };
        $scope.flush= function(){
            console.log('Flush database');
            cosmicDB.removeAllArtworks().then(function(){
                console.log('Artworks removed');
                cosmicDB.flushDatabase().then(function(){
                    $cordovaToast.showShortTop('Database cleared !');
                },function(err){
                    console.error(err);
                });
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


