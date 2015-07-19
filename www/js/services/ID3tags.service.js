angular.module('cosmic.services').factory("ID3Tags", function($q) {

    var ID3Service={

        readTags : function (fileName,file){
            var self = this;
            var defered=$q.defer();

            ID3.loadTags(fileName,function() {

                var tags = ID3.getAllTags(fileName);
                var currentTitle={title:tags.title,album: tags.album, artist:tags.artist,track:tags.track,year:tags.year};
                var image = tags.picture;

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
                    defered.reject(reason);
                }
            });
            return defered.promise;

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
            var format = self.pictureFormat(image.format);
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

            var path=cordova.file.externalRootDirectory+'Music/Mymusic/';
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

