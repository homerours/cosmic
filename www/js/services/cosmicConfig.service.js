angular.module('cosmic.services').factory("cosmicConfig", function() {
    return {
        appRootStorage  : cordova.file.externalApplicationStorageDirectory,
        appDataFolder   : cordova.file.applicationDirectory + 'www/data/',
        extensionsAudio : ['mp3','m4a']
    };
});

