// Manage directories
angular.module('cosmic.controllers').controller('ManageDirectoriesCtrl', function($scope,$ionicPlatform,$cordovaSQLite,deviceFS,cosmicDB,$cordovaToast,cosmicConfig, imageService, onlineArtwork,$ionicModal) {

    $scope.showDirectoryBrowser = function (){

    };


    $ionicModal.fromTemplateUrl('file-browser-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    $scope.openModal = function() {
        $scope.modal.show();
    };
    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

});



