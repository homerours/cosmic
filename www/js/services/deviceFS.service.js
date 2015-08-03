// Scan recursively a provided local directory and look for music (mp3 and m4a) music files
angular.module('cosmic.services').factory("deviceFS", function($q,cosmicDB,ID3Tags,cosmicConfig,$cordovaToast) {

    var deviceFSService = {

        // Verify that the storage directories exists and create needed directories
        initDeviceFS : function(){
            var q = $q.defer();
            var path = cosmicConfig.appRootStorage;
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
                            q.resolve();
                        }, function (error) {
                            q.reject('Directory Initialisation failed : '+error);
                        });
                    }, function (error) {
                        q.reject('Directory Initialisation failed : '+error);
                    });
                }, function (error) {
                    q.reject('Directory Initialisation failed : '+error);
                });
            }, function (error) {
                q.reject('Directory Initialisation failed : '+error);
            });
            return q.promise;
        },

        // Scan entry from local filesystem
        handleItem : function(entry,results){
            var extensionsAudio=cosmicConfig.extensionsAudio;
            var self=this;
            var hDeferred=$q.defer();

            // Audio file
            if (entry.isFile) {
                var fileName = entry.name;
                var extension=fileName.substr(fileName.lastIndexOf('.')+1);
                console.log('exploring '+fileName+', ext : ' + extension);
                if (extensionsAudio.indexOf(extension.toLowerCase())!=-1){
                    cosmicDB.isInDatabase(entry.nativeURL).then(function(res){
                        if (res){
                            hDeferred.resolve();
                        } else {
                            results.push(entry.nativeURL);
                            hDeferred.resolve();
                        }
                    });
                } else {
                    hDeferred.resolve();
                }
            }
            //Directory
            if (entry.isDirectory){
                self.scanDirectory(entry.nativeURL,results).then(function(res){
                    hDeferred.resolve();
                });
            }
            return hDeferred.promise;
        },
        scanDirectory: function(path,results){
            var self=this;
            var d= $q.defer();
            var promises = [];

            window.resolveLocalFileSystemURL(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();

                directoryReader.readEntries(function(entries) {

                    for (var index=0;index<entries.length;index++){
                        promises.push(self.handleItem(entries[index],results));
                    }
                    var sz=promises.length;
                    $q.all(promises).then(function(res){
                        d.resolve();
                    });
                },function(err){
                    console.log('Read entries error');
                    console.dir(err);
                    d.resolve();
                });
            });
            return d.promise;
        },

        // Start to scan 'path', find music files, extract ID3 tags and add them to database
        scanMusicFolder: function(path){
            var d=$q.defer();
            var results=[];
            $cordovaToast.showShortCenter('Start to scan the directory');
            this.scanDirectory(path,results).then(function(res){
                console.log('DONE SCAN');
                $cordovaToast.showShortCenter('Find '+results.length+' music files to add !');
                return ID3Tags.readTagsFromFileList(results);
            }).then(function(tagList){
                $cordovaToast.showShortCenter('ID3 Tags Loaded !');
                return cosmicDB.addTitleList(tagList);
            }).then(function(){
                $cordovaToast.showShortCenter('Database Ready !');
                console.log('DATABASE READY');
                d.resolve();
            });
            return d.promise;
        }

    };

    deviceFSService.initDeviceFS();
    return deviceFSService;

});


