// Get album covers from iTunes API
angular.module('cosmic.services').factory("onlineArtwork", function($q,cosmicConfig, $http, $cordovaFileTransfer) {

    var onlineArtworkService={
        itunesApiUrl : "https://itunes.apple.com/search?",
        downloadArtworkFromItunes : function(title){
            var self = this;
            var d=$q.defer();
            if (title.artist == "Unknown Artist" && title.album == "Unknown Album"){
                d.reject('Not enough information !');
            } else {
                var terms = "term=" + title.artist + "+" + title.album + "&entity=album&limit=1";
                $http.get(self.itunesApiUrl + terms).success(function(data){
                    console.log(data);
                    if (data.results.length > 0){
                        var url100 = data.results[0].artworkUrl100;
                        var url300 = url100.replace('100x100-75.jpg','300x300-75.jpg');
                        var url600 = url100.replace('100x100-75.jpg','600x600-75.jpg');
                        var trustHosts = true;
                        var dt=new Date();
                        var options = {};
                        var imageFileName='artwork_'+(dt.getTime()).toString()+'.jpg';
                        var p1 = $cordovaFileTransfer.download(url600,cosmicConfig.appRootStorage + 'artworks/'+imageFileName,options,trustHosts);
                        var p2 = $cordovaFileTransfer.download(url300,cosmicConfig.appRootStorage + 'miniatures/'+imageFileName,options,trustHosts);
                        $q.all([p1,p2]).then(function(){
                            d.resolve(imageFileName);
                        },function(error){
                            console.log('Error during artwork download');
                            d.reject(error);
                        });
                    } else {
                        d.reject('no results');
                    }

                }).error(function(error){
                    d.reject(error);
                });
            }

            return d.promise;
        },

        correctArtistNameFromItunes : function(artist){
            var self = this;
            var d=$q.defer();
            if (artist == "Unknown Artist"){
                d.reject('Not enough information !');
            } else {
                var terms = "term=" + artist + "&entity=musicArtist&limit=1";
                $http.get(self.itunesApiUrl + terms).success(function(data){
                    if (data.results.length > 0){
                        var itunesArtist = data.results[0].artistName;
                        d.resolve(itunesArtist);
                    } else {
                        d.reject('no results');
                    }

                }).error(function(error){
                    d.reject(error);
                });
            }

            return d.promise;

        }

    };

    return onlineArtworkService;
});

