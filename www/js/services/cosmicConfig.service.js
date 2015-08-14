angular.module('cosmic.services').factory("cosmicConfig", function($q, $cordovaFile) {
    var config =  {
        appRootStorage  : cordova.file.externalApplicationStorageDirectory,
        appDataFolder   : cordova.file.applicationDirectory + 'www/data/',
        extensionsAudio : ['mp3','m4a']
    };

    // Directories init
    var path = config.appRootStorage;
    var dataPath = config.appDataFolder;
    var dirName = 'artworks';
    var dirName2 = 'tmp';
    var dirName3 = 'miniatures';
    console.log('Initialisation : '+ path);

    window.resolveLocalFileSystemURL(path, function (fileSystem) {
        fileSystem.getDirectory(dirName, {create : true, exclusive : false}, function (result) {
            console.log('Create folder : ' + dirName);
            fileSystem.getDirectory(dirName2, {create : true, exclusive : false}, function (result) {
                console.log('Create folder : ' + dirName2);
                fileSystem.getDirectory(dirName3, {create : true, exclusive : false}, function (result) {
                    console.log('Create folder : ' + dirName3);


                    $cordovaFile.copyFile(dataPath+'artworks/','default_artwork.jpg',path + 'artworks/','default_artwork.jpg').then(function(){
                        console.log('Copy default artwork');
                    });
                    $cordovaFile.copyFile(dataPath+'miniatures/','default_artwork.jpg',path + 'miniatures/','default_artwork.jpg').then(function(){
                        console.log('Copy default miniatures');
                    });


                    console.log('Success: File system init');
                }, function (error) {
                    console.log('Directory Initialisation failed : '+error);
                });
            }, function (error) {
                console.log('Directory Initialisation failed : '+error);
            });
        }, function (error) {
            console.log('Directory Initialisation failed : '+error);
        });
    }, function (error) {
        console.log('Directory Initialisation failed : '+error);
    });

    return config;
});

