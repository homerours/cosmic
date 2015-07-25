angular.module('cosmic.services').factory("imageService", function($q,cosmicConfig) {

    var imageService={

        b64toBlob : function (byteCharacters, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            //var byteCharacters = atob(b64Data);
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

        makeMiniature : function(fileName){
            console.log('Make miniature for '+ fileName);
            var extension=fileName.substr(fileName.lastIndexOf('.')+1);
            var self=this;
            var defered=$q.defer();
            var imageUrl = cosmicConfig.appRootStorage + 'artworks/' + fileName;
            console.log(imageUrl);
            console.log(extension);
            var options = {storeImage : false, format:extension, imageDataType: ImageResizer.IMAGE_DATA_TYPE_URL, resizeType:ImageResizer.RESIZE_TYPE_MIN_PIXEL };
            window.imageResizer.resizeImage(
                function(data) {
                    console.log('miniature success');
                    var b64Image=data.imageData;
                    b64Image = b64Image.replace(/[\n\r]/g, '');
                    self.storeBase64Image(atob(b64Image),'miniatures/',fileName).then(function(){
                    console.log('miniature store success');
                        defered.resolve(data.imageData);
                    });
                }, function (error) {
                    console.log("Error making miniature : "+ fileName + "   " + error);
                    defered.reject(error);
                }, imageUrl, 80,80, options);

                return defered.promise;

        },
        storeBase64Image : function(base64Image, folder,imageFileName){
            var self=this;
            var defered=$q.defer();
            var extension=imageFileName.substr(imageFileName.lastIndexOf('.')+1);
            var format = self.pictureFormat(extension);
            var imageBlob = self.b64toBlob(base64Image,format.mime);
            //var miniatureBlob = self.b64toBlob(btoa(base64Miniature),format.mime);


            var path=cosmicConfig.appRootStorage + folder;
            // Get the directory
            window.resolveLocalFileSystemURL(path, function(dir) {
                // Get the file
                console.log(imageFileName);
                dir.getFile(imageFileName, {create:true}, function(imageFile) {
                    // Write file
                    imageFile.createWriter(function(fileWriter) {
                        fileWriter.write(imageBlob);
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

        storeArtwork: function(image){
            var self=this;
            var defered=$q.defer();
            var imgformat = (image.format || "jpg");
            var format = self.pictureFormat(imgformat);
            // Generate random file name
            var d=new Date();
            var imageFileName='artwork_'+(d.getTime()).toString()+format.extension;

            // Process the data
            var base64Image = "";
            for (var i = 0; i < image.data.length; i++) {
                base64Image += String.fromCharCode(image.data[i]);
            }
            //var base64Miniature = self.makeMiniature(base64Image);
            self.storeBase64Image(base64Image,'tmp/',imageFileName).then(function(){
                defered.resolve(imageFileName);
            });
            return defered.promise;
        },
    };

    return imageService;
});

