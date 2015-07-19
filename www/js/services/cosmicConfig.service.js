angular.module('cosmic.services').factory("cosmicConfig", function() {
    return {
        appRootStorage : cordova.file.externalApplicationStorageDirectory,
        extensionsAudio : ['mp3','m4a']
    };
});

