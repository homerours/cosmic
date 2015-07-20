angular.module('cosmic.services').factory("ID3Tags", function($q,cosmicConfig) {

    var ID3Service={

        readTags : function (fileName,file){
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
                if (image){
                    console.log('This title has an artwork!');
                    self.storeArtwork(image).then(function(imageFileName){
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
                    var fileBegining=file.slice(0,400000);
                    var fileEnd=file.slice(-500);
                    file=[];

                    self.readTags(fileName,fileBegining).then(function(tags){
                        if (tags.title){
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
            var blockSize = 50;
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

        },

        b64toBlob : function (b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            var blob = new Blob(byteArrays, {type: contentType});
            return blob;
        },

        pictureFormat: function (format){
            var lowerFormat=format.toLowerCase();
            if (lowerFormat.indexOf('png')>=0){
                return {extension: '.png', mime: 'image/png'};
            } else {
                return {extension: '.jpg', mime: 'image/jpeg'};
            }

        },

        storeArtwork: function(image){
            var self=this;
            var defered=$q.defer();
            var imgformat = (image.format || "jpg");
            var format = self.pictureFormat(imgformat);
            // Process the data
            var base64String = "";
            for (var i = 0; i < image.data.length; i++) {
                base64String += String.fromCharCode(image.data[i]);
            }
            base64String=btoa(base64String);
            var blob = self.b64toBlob(base64String,format.mime);

            // Generate random file name
            var d=new Date();
            var imageFileName='artwork_'+(d.getTime()).toString()+format.extension;

            var path=cosmicConfig.appRootStorage + 'tmp/';
            // Get the directory
            window.resolveLocalFileSystemURL(path, function(dir) {
                // Get the file
                console.log(imageFileName);
                dir.getFile(imageFileName, {create:true}, function(imageFile) {
                    // Write file
                    imageFile.createWriter(function(fileWriter) {
                        fileWriter.write(blob);
                        console.log("Artwork file written");
                        defered.resolve(imageFileName);
                    }, function(err){
                        console.log('Error for artwork file write');
                        console.dir(err);
                        defered.resolve();
                    });
                }, function(err){
                    console.log('Error for opening file');
                    console.dir(err);
                    defered.resolve();
                });
            }, function(err){
                console.log('Error opening dir');
                console.dir(err);
                defered.resolve();
            });
            return defered.promise;
        },

    } ;
    return ID3Service;


});

