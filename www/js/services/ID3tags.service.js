angular.module('cosmic.services').factory("ID3Tags", function($q,cosmicConfig,imageService) {

    var ID3Service={

        handleArtworks : true,
        readTags : function (fileName,file,getArtwork){
            var self = this;
            var defered=$q.defer();


            // Generate file key for the tags databse
            var d=new Date();
            var tagsKey='fileName'+(d.getTime()).toString();

            ID3.loadTags(tagsKey,function() {

                console.log('Got tags for '+fileName);
                var tags = ID3.getAllTags(tagsKey);
                var image = tags.picture;
                ID3.clearTags(tagsKey);
                var currentTitle={title:tags.title,album: tags.album, artist:tags.artist,track:tags.track,year:tags.year};

                // If album cover
                if (image && self.handleArtworks && image.data.length > 100 && image.data.length < 1000000){
                    console.log('This title has an artwork! Length: ' + image.data.length);
                    imageService.storeArtwork(image).then(function(imageFileName){
                        currentTitle.artwork=imageFileName;
                        defered.resolve(currentTitle);
                    });
                } else {
                    defered.resolve(currentTitle);
                }
            },{
                tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
                dataReader:FileAPIReader(file),
                onError: function(reason) {
                    console.log('Error in ID3 tags reading : '+ reason);
                    defered.resolve(reason);
                }
            });
            return defered.promise;

        },
        pushToTagList : function(path,tagList){
            console.log('PUSH :'+path);
            var self=this;
            var d= $q.defer();
            window.resolveLocalFileSystemURL(path,function(entry){
                var fileName = entry.name;
                var name=fileName.substr(0,fileName.lastIndexOf('.'));
                entry.file(function(file){
                    var fileBegining=file.slice(0,600000);
                    var fileEnd=file.slice(-500);
                    file=[];

                    self.readTags(fileName,fileBegining).then(function(tags){
                        if (tags.title || tags.artist){
                            var title  = tags.title || name;
                            var artist = tags.artist || 'Unknown Artist';
                            var album  = tags.album || 'Unknown Album';
                            var track  = tags.track || 1;
                            var year = tags.year;
                            var currentTitle={title:title,album: album, artist:artist,track:track,year:year,path:entry.nativeURL,artwork:tags.artwork};
                            tagList.push(currentTitle);
                            d.resolve();
                        } else {
                            self.readTags(fileName,fileEnd).then(function(tags2){
                                var title  = tags2.title || name;
                                var artist = tags2.artist || 'Unknown Artist';
                                var album  = tags2.album || 'Unknown Album';
                                var track  = tags2.track || 1;
                                var year = tags2.year;
                                var currentTitle={title:title,album: album, artist:artist,track:track,year:year,path:entry.nativeURL, artwork : tags2.artwork};
                                tagList.push(currentTitle);
                                d.resolve();
                            });
                        }
                    });

                },function(err){
                    console.log('Error: unable to open file, special characters in path');
                    console.log(fileName);
                    tagList.push({title : name, artist : 'Unknown Artist', album: 'Unknown Album', track : 1, year :undefined, path : path});
                    d.resolve();
                });

            },function(err){
                console.log('Error: unable to resolve local file system to read id3 tags from file');
                d.resolve();
            });

            return d.promise;
        },

        readTagsFromFileList : function(fileList){
            var self=this;
            var d= $q.defer();
            var tagList=[];
            var blockSize = 20;
            var nbBlocks = Math.ceil(fileList.length / blockSize);
            var syncLoop = function(i){
                console.log('BLOCK '+i);
                if (i>= nbBlocks){
                    d.resolve(tagList);
                } else {
                    var promises = [];
                    for (var index=i*blockSize; index < Math.min((i+1)*blockSize,fileList.length);index++){
                        promises.push(self.pushToTagList(fileList[index],tagList));
                    }
                    $q.all(promises).then(function(res){
                        i++;
                        syncLoop(i);
                    });
                }
            };
            syncLoop(0);
            return d.promise;

        }

    } ;
    return ID3Service;


});

