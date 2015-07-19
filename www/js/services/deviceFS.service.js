angular.module('cosmic.services').factory("deviceFS", function($q,cosmicDB,ID3Tags,cosmicConfig,$cordovaToast) {

    var deviceFSService = {

        // Verify that the storage directories exists
        initDeviceFS : function(){
            var q = $q.defer();
            var path = cosmicConfig.appRootStorage;
            var dirName = 'artworks';
            var dirName2 = 'tmp';
            console.log('Initialisation : '+ path);

            window.resolveLocalFileSystemURL(path, function (fileSystem) {
                fileSystem.getDirectory(dirName, {create : true, exclusive : false}, function (result) {
                    console.log('Create folder : ' + dirName);
                    fileSystem.getDirectory(dirName2, {create : true, exclusive : false}, function (result) {
                        console.log('Create folder : ' + dirName2);
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
            return q.promise;
        },

        handleItem : function(entry,results){
            var extensionsAudio=cosmicConfig.extensionsAudio;
            var self=this;
            var hDeferred=$q.defer();
            var fileName = entry.name;
            var extension=fileName.substr(fileName.lastIndexOf('.')+1);
            console.log('exploring '+fileName+', ext : ' + extension);
            // Audio file
            if (entry.isFile) {
                if (extensionsAudio.indexOf(extension.toLowerCase())!=-1){

                    entry.file(function(file){
                        var fileBegining=file.slice(0,500000);
                        var fileEnd=file.slice(-500);
                        file=[];

                        ID3Tags.readTags(fileName,fileBegining).then(function(tags){
                            if (tags.title){
                                console.log('Got tags :',tags);
                                var title  = tags.title || name;
                                var artist = tags.artist || 'Unknown Artist';
                                var album  = tags.album || 'Unknown Album';
                                var track  = tags.track || 1;
                                var year = tags.year;
                                var currentTitle={title:title,album: album, artist:artist,track:track,year:year,path:entry.nativeURL,artwork:tags.artwork};
                                results.push(currentTitle);
                                hDeferred.resolve();
                            } else {
                                ID3Tags.readTags(fileName,fileEnd).then(function(tags2){
                                    var title  = tags2.title || name;
                                    var artist = tags2.artist || 'Unknown Artist';
                                    var album  = tags2.album || 'Unknown Album';
                                    var track  = tags2.track || 1;
                                    var year = tags2.year;
                                    var currentTitle={title:title,album: album, artist:artist,track:track,year:year,path:entry.nativeURL, artwork : tags2.artwork};
                                    results.push(currentTitle);
                                    console.log(title);
                                    hDeferred.resolve();
                                });
                            }
                        });

                    },function(err){
                        console.log('Error: hashtag in path');
                        //console.dir(err);
                        hDeferred.resolve();
                    });
                } else {
                    hDeferred.resolve();
                }
            }

            //Directory
            if (entry.isDirectory){
                console.log('path: '+entry.nativeURL);
                self.scanDirectory(entry.nativeURL,results).then(function(res){
                    hDeferred.resolve();
                });
            }
            return hDeferred.promise;
        },
        scanDirectory: function(path,results){
            console.log('SCAN: '+path );
            var self=this;
            var d= $q.defer();
            var promises = [];

            window.resolveLocalFileSystemURL(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();

                directoryReader.readEntries(function(entries) {
                    console.log("readEntries");
                    console.dir(entries);

                    for (var index=0;index<entries.length;index++){
                        promises.push(self.handleItem(entries[index],results));
                    }
                    var sz=promises.length;
                    console.log(sz+' promises to resolve');
                    $q.all(promises).then(function(res){
                        console.log('all done: '+sz);
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
        startScan: function(){
            var path=cordova.file.externalRootDirectory+'Music/Mymusic/';
            var results=[];
            console.log('ROOT: '+cordova.file.externalRootDirectory);
            this.scanDirectory(path,results).then(function(res){
                console.dir(results);
                console.log('DONE SCAN');
                var syncLoop = function(i){
                    if (i>= results.length){
                        $cordovaToast.showShortCenter('Database Ready !');
                        console.log('DATABASE READY');
                    } else {
                        cosmicDB.addTitle(results[i]).then(function(){
                            i++;
                            syncLoop(i);
                        });
                    }
                };
                syncLoop(0);

            },function(err){
                console.error(err);
            });
        }

    };

    deviceFSService.initDeviceFS();
    return deviceFSService;

});


