// Manage directories
angular.module('cosmic.controllers').controller('ManageDirectoriesCtrl', function($scope,deviceFS,cosmicDB,$cordovaToast,cosmicConfig, $ionicModal, fileFactory, $localstorage,$ionicListDelegate) {

    $scope.directories = $localstorage.getArray('music_directories');
    for (var i=0; i<$scope.directories.length; i++){
        $scope.directories[i].isLoading=false;
    }

    $scope.isScanning = false;
    $scope.scanDirectory = function(directory){
        if ($scope.isScanning){
            $cordovaToast.showShortTop('Please wait for the first scan to be finished');
        } else {
            $ionicListDelegate.$getByHandle('directory-list').closeOptionButtons();
            $scope.isScanning = true;
            directory.isLoading = true;
            deviceFS.scanMusicFolder(directory.nativeURL).then(function(res){
                $scope.isScanning = false;
                directory.isLoading = false;
            });
        }
    };

    $scope.removeDirectory = function(directory){
        var index = $scope.directories.indexOf(directory);
        var storedDir = $localstorage.getArray('music_directories');
        storedDir.splice(index,1);
        $localstorage.setObject('music_directories',storedDir);
        $scope.directories.splice(index,1);
    };

    $scope.addDirectory = function(file){
        console.log('Add directory');
        if (file.isDirectory){
            // Check if the directory if a child of an already-included directory
            var isChild = false;
            var i = 0;
            while( !isChild && i < $scope.directories.length){
                isChild = (file.fullPath.indexOf($scope.directories[i].fullPath) === 0);
                i++;
            }
            if (isChild){
                $cordovaToast.showShortTop('This directory is already included !');
            } else {
                var directory = {fullPath : file.fullPath, nativeURL : file.nativeURL,isLoading : false};
                $scope.directories.push(directory);
                var storedDir = $localstorage.getArray('music_directories');
                storedDir.push({fullPath : file.fullPath, nativeURL : file.nativeURL});
                $localstorage.setObject('music_directories',storedDir);
                $scope.closeModal();
                // Scan the new directory
                $scope.scanDirectory(directory);
            }
        } else {
            $cordovaToast.showShortTop('Please select a DIRECTORY');
        }
    };


    // Modal for directory browser
    $scope.openModal = function() {
        $ionicModal.fromTemplateUrl('templates/file-browser-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
            if ($scope.isScanning){
                $cordovaToast.showShortTop('Please wait for the first scan to be finished');
            } else {
                $scope.modal.show();
            }
            $scope.closeModal = function() {
                $scope.modal.remove().then(function(){
                    $scope.modal=null;
                });
            };
        });
    };

    var fs = new fileFactory();

    fs.getEntriesAtRoot().then(function(result) {
        $scope.files = result;
        $scope.hasParent = false;
    }, function(error) {
        console.error(error);
    });

    $scope.getContents = function(path) {
        fs.getEntries(path).then(function(result) {
            $scope.files = result;
            fs.getParentDirectory(path).then(function(result) {
                if (result.nativeURL == path){
                    $scope.hasParent = false;
                } else {
                    $scope.hasParent = true;
                    $scope.backURL = result.nativeURL;
                }
            });
        });
    };



});



