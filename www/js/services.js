var cosmicMobileServices = angular.module('cosmic.services', ['ngCordova']);

cosmicMobileServices.factory('cosmicDB',  function($q,$cordovaSQLite, cosmicPlayer) {
    var database={
        db: null,
        initDatabase: function(){
            console.log("INIT DATABASE");
            this.db = $cordovaSQLite.openDB("cosmic");

        },
        flushDatabase: function(){
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS artist");
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS album");
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS title");
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS artwork");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artist (id integer primary key autoincrement, name text)");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS album (id integer primary key autoincrement, name text, artist integer)");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS title (id integer primary key autoincrement, name text, album integer, track integer, year integer,path text, artwork integer default 1)");
            var self=this;
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artwork (id integer primary key autoincrement, file_name text)").then(function(){
                $cordovaSQLite.execute(self.db, "INSERT INTO artwork (file_name) VALUES (?)",['default_artwork.jpg']);
            });
        },

        getArtists: function(){
            // Get all artists from database
            return $cordovaSQLite.execute(this.db,"SELECT * FROM artist ORDER BY name", []).then(function(res) {
                var artists=[];
                for (var i=0; i < res.rows.length; ++i){
                    artists.push(res.rows.item(i));
                }
                return artists;
            });
        },

        getTitles:  function(artistId){
            // Get all titles from artist
            var query= "SELECT t.name AS titleName, t.id AS titleId,t.track, t.path AS path, art.file_name AS artworkFileName, albumName , albumId , artistName FROM"+
                " title t INNER JOIN artwork art ON t.artwork=art.id INNER JOIN"+
                " (SELECT ar.name AS artistName, al.name AS albumName, al.id AS albumId FROM"+
                " (SELECT * FROM artist WHERE id=?) ar INNER JOIN album al ON al.artist=ar.id) a"+
                " ON t.album=a.albumId ORDER BY albumName,t.track";
            return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {
                console.log('Got '+res.rows.length+' titles');
                console.dir(res.rows.item(0));
                var albums=[];
                var viewPlaylist=[];
                var i = 0;
                var path=cordova.file.externalRootDirectory+'Music/Mymusic/';
                while (i<res.rows.length){
                    var currentAlbumId=res.rows.item(i).albumId;
                    var currentAlbum={name: res.rows.item(i).albumName, id : res.rows.item(i).albumId};
                    var titles= [];
                    while (i<res.rows.length && res.rows.item(i).albumId==currentAlbumId){
                        titles.push({name:res.rows.item(i).titleName, id: res.rows.item(i).titleId, index : i, artwork: res.rows.item(i).artworkFileName});
                        // Index is the position of the song in the playlist
                        viewPlaylist.push({name:res.rows.item(i).titleName, album: res.rows.item(i).albumName,artist : res.rows.item(i).artistName, path : res.rows.item(i).path ,id: res.rows.item(i).titleId, artwork : path+res.rows.item(i).artworkFileName});
                        i++;
                    }
                    currentAlbum.titles=titles;
                    albums.push(currentAlbum);
                }
                cosmicPlayer.loadViewPlaylist(viewPlaylist);
                return albums;
            },function(err){
                console.log('error');
                console.dir(err);
            });
        },
        getArtistId: function(artistName){
            console.log('get id from'+artistName);
            var dbService=this;
            return $cordovaSQLite.execute(dbService.db, "SELECT * FROM artist WHERE name=?", [artistName]).then(function(res) {
                if (res.rows.length>0){
                    // Existing artist
                    console.log(JSON.stringify(res.rows.item(0)));
                    return res.rows.item(0).id;
                } else {
                    // No artist
                    console.log('no artist');
                    return 0;
                }
            });

        },
        getAlbumId: function(albumName,artistId){
            var dbService=this;
            return $cordovaSQLite.execute(dbService.db, "SELECT * FROM album WHERE name=? AND artist=?", [albumName,artistId]).then(function(res) {
                if (res.rows.length>0){
                    // Existing album
                    return res.rows.item(0).id;
                } else {
                    // No album
                    return 0;
                }
            });
        },
        addArtist: function(artistName){
            console.log('add '+artistName);
            var dbService=this;
            return dbService.getArtistId(artistName).then(function(artistId){
                console.log('id '+artistId);
                if (artistId===0){
                    return $cordovaSQLite.execute(dbService.db,"INSERT INTO artist (name) VALUES (?)", [artistName]).then(function(res) {
                        console.log("INSERT ID -> " + res.insertId);
                        return res.insertId;
                    });
                } else {
                    return artistId;
                }

            });
        },
        addAlbum: function(albumName,artistId){
            var dbService=this;
            return dbService.getAlbumId(albumName,artistId).then(function(albumId){
                if (albumId===0){
                    return $cordovaSQLite.execute(dbService.db,"INSERT INTO album (name,artist) VALUES (?,?)", [albumName,artistId]).then(function(res) {
                        console.log('insert album '+albumName+' with id '+res.insertId+' for artistid '+artistId);
                        return res.insertId;
                    });
                } else {
                    return albumId;
                }

            });
        },

        addTitle: function(title){
            var defered=$q.defer();
            var dbService=this;
            $cordovaSQLite.execute(dbService.db,"SELECT * FROM title WHERE path=?", [title.path]).then(function(res) {
                if (res.rows.length===0){
                    dbService.addArtist(title.artist).then(function(artistId){
                        return dbService.addAlbum(title.album,artistId);
                    })
                    .then(function(albumId){
                        // Inserting new title
                        return dbService.addArtwork(title.artwork).then(function(artworkId){
                            return $cordovaSQLite.execute(dbService.db,"INSERT INTO title (name,album,track,year,path,artwork) VALUES (?,?,?,?,?,?)", [title.title,albumId,title.track,title.year,title.path,artworkId]);
                        });
                    })
                    .then(function(res) {
                        console.log(res);
                        console.log('Inserted title '+ title.title);
                        defered.resolve(res.insertId);
                    }, function (err){
                        console.dir(err);
                        defered.reject(err);
                    });

                } else {
                    // No title
                    defered.resolve(0);
                }
            });
            return defered.promise;
        },

        addArtwork: function(fileName){
            var self=this;
            var defered=$q.defer();
            console.log('add Artwork');
            if (fileName){
                console.log('Title has artwork');
                $cordovaSQLite.execute(self.db,"INSERT INTO artwork (file_name) VALUES (?)", [fileName]).then(function(res) {
                    console.log("INSERT ARTWORK ID -> " + res.insertId);
                    defered.resolve(res.insertId);
                });
            } else {
                defered.resolve(1);
            }
            return defered.promise;
        },
    };
    database.initDatabase();
    return database;
});

cosmicMobileServices.factory("$fileFactory", function($q,cosmicDB) {

    var File = function() { };

    File.prototype = {

        getParentDirectory: function(path) {
            var deferred = $q.defer();
            window.resolveLocalFileSystemURI(path, function(fileSystem) {
                fileSystem.getParent(function(result) {
                    deferred.resolve(result);
                }, function(error) {
                    deferred.reject(error);
                });
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },

        getEntriesAtRoot: function() {
            var deferred = $q.defer();
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                var directoryReader = fileSystem.root.createReader();
                directoryReader.readEntries(function(entries) {
                    deferred.resolve(entries);
                }, function(error) {
                    deferred.reject(error);
                });
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },

        getEntries: function(path) {
            var deferred = $q.defer();
            window.resolveLocalFileSystemURI(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();
                directoryReader.readEntries(function(entries) {
                    deferred.resolve(entries);
                }, function(error) {
                    deferred.reject(error);
                });
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },
        readTags : function (fileName,file){
            var defered=$q.defer();
            ID3.loadTags(fileName,function() {
                var tags   = ID3.getAllTags(fileName);
                defered.resolve(tags);
            },{
                tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
                dataReader:FileAPIReader(file),
                onError: function(reason) {
                    console.log('Error in ID3 tags reading');
                    console.dir(reason);
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
            var myfs=this;
            var defered=$q.defer();
            var format = myfs.pictureFormat(image.format);
            // Process the data
            var base64String = "";
            for (var i = 0; i < image.data.length; i++) {
                base64String += String.fromCharCode(image.data[i]);
            }
            base64String=btoa(base64String);
            var blob = myfs.b64toBlob(base64String,format.mime);
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

        handleItem : function(entry,results){
            var extensionsAudio=['mp3','m4a'];
            var myfs=this;
            var hDeferred=$q.defer();
            var fileName = entry.name;
            var extension=fileName.substr(fileName.lastIndexOf('.')+1);
            var name=fileName.substr(0,fileName.lastIndexOf('.'));
            console.log('exploring '+fileName+', ext : ' + extension);
            // Audio file
            if (entry.isFile) {
                if (extensionsAudio.indexOf(extension)!=-1){

                    entry.file(function(file){
                        var fileBegining=file.slice(0,500000);
                        var fileEnd=file.slice(-500);
                        file=[];

                        myfs.readTags(fileName,fileBegining).then(function(tags){
                            if (tags.title){
                                console.log('Got tags :',tags);
                                var title  = tags.title || name;
                                var artist = tags.artist || 'Unknown Artist';
                                var album  = tags.album || 'Unknown Album';
                                var track  = tags.track || 1;
                                var image=tags.picture;
                                var currentTitle={title:title,album: album, artist:artist,track:track,year:tags.year,path:entry.nativeURL};
                                console.log(title);
                                if (image){
                                    console.log('This title has an artwork!');
                                    myfs.storeArtwork(image).then(function(imageFileName){
                                        currentTitle.artwork=imageFileName;
                                        results.push(currentTitle);
                                        hDeferred.resolve();
                                    });
                                } else {
                                    results.push(currentTitle);
                                    hDeferred.resolve();
                                }

                            } else {
                                myfs.readTags(fileName,fileEnd).then(function(tags2){
                                    var title  = tags2.title || name;
                                    var artist = tags2.artist || 'Unknown Artist';
                                    var album  = tags2.album || 'Unknown Album';
                                    var track  = tags2.track || 1;
                                    var year = tags2.year;
                                    var currentTitle={title:title,album: album, artist:artist,track:track,year:year,path:entry.nativeURL};
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
                myfs.scanDirectory(entry.nativeURL,results).then(function(res){
                    hDeferred.resolve();
                });
            }
            return hDeferred.promise;
        },
        scanDirectory: function(path,results){
            console.log('SCAN: '+path );
            var myfs=this;
            var d= $q.defer();
            var promises = [];

            window.resolveLocalFileSystemURL(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();

                directoryReader.readEntries(function(entries) {
                    console.log("readEntries");
                    console.dir(entries);

                    for (var index=0;index<entries.length;index++){
                        promises.push(myfs.handleItem(entries[index],results));
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

    return File;

});

cosmicMobileServices.factory('cosmicPlayer',  function($interval,$q,$cordovaMedia) {
    var player = {
        playing: false,
        onUpdate:function(position){},
        onTitleChange:function(){},
        isWatchingTime: null,
        duration:0,
        media: null,
        playlist: [{artist:'Muse',title:'Time is Running Out',path:'file:///storage/emulated/0/Music/My_music/Fold.mp3'}],
        viewPlaylist: [],
        playlistIndex: 0,
        volume: 70,
        setIndex : function(index){
            this.playlistIndex=index;
        },
        setVolume: function() {
            console.log('New volume: '+ this.volume);
            this.media.setVolume(this.volume/100);
        },

        loadPlaylist: function() {
            console.log('Load playlist, size: '+this.viewPlaylist.length);
            player.playlist = player.viewPlaylist;
            console.dir(this.playlist);
        },
        loadViewPlaylist: function(playlist) {
            player.viewPlaylist = playlist;
        },

        initMedia: function() {
            var self=this;
            self.clearMedia();
            console.log('init media');
            var mypath=this.playlist[self.playlistIndex].path;
            self.media=new Media(mypath,function(leo){
            },function(err){
            });
            self.play();
            self.onTitleChange();
        },
        clearMedia: function(){
            var self=this;
            self.stopWatchTime();
            if (self.media){
                self.media.release();
                self.media=null;
            }
        },
        setOnUpdate : function(onUpdate){
            this.onUpdate=onUpdate;
        },
        setOnTitleChange : function(onTitleChange){
            this.onTitleChange=onTitleChange;
        },
        // player launcher for the controller
        launchPlayer: function(index) {
            var self=this;
            self.setIndex(index);
            self.loadPlaylist();
            self.initMedia();
        },
        play: function() {
            this.startWatchTime();
            this.media.play();
            player.playing = true;
        },
        pause: function() {
            this.media.pause();
            this.stopWatchTime();
            player.playing = false;
        },
        stop: function() {
            this.media.stop();
            this.stopWatchTime();
            player.playing = false;
        },
        seek: function(percent) {
            console.log(percent);
            var self=this;
            if (self.duration >0){
                var newPosition=percent*self.duration;
                self.media.seekTo(newPosition);
                self.onUpdate(newPosition);
            }
        },
        prev: function() {
            var self=this;
            self.media.getCurrentPosition(function(pos){
                if (pos<=5){
                    self.playlistIndex = (self.playlistIndex + self.playlist.length - 1) % self.playlist.length;
                    self.initMedia(self.playlistIndex);
                } else {
                    self.seek(0);
                }
            });
        },
        next: function() {
            var self=this;
            self.playlistIndex = (self.playlistIndex + 1) % self.playlist.length;
            self.initMedia(self.playlistIndex);
        },
        startWatchTime: function() {
            var self=this;
            if (self.media){
                var dur;
                var counter=0;
                self.isWatchingTime=$interval(function(){
                    self.media.getCurrentPosition(function(pos){
                        self.onUpdate(1000*pos);
                        if (self.duration>0 && 1000*pos>=self.duration-600){
                            console.log('End of current song --- play next song');
                            self.next();
                        }
                        //console.log('time : ',pos);
                    });
                },500);
            } else {
                self.onUpdate(0);
            }
            return;
        },
        stopWatchTime : function(){
            var self=this;
            if (self.isWatchingTime){
                $interval.cancel(self.isWatchingTime);
                self.isWatchingTime=null;
            }
            return;
        },
        getDuration: function() {
            var defered=$q.defer();
            var self=this;
            if (self.media){
                var dur;
                var counter=0;
                var inter=$interval(function(){
                    dur=self.media.getDuration();
                    console.log('tour : ',counter);
                    if (dur>=0 || counter>10){
                        $interval.cancel(inter);
                        self.duration=1000*dur;
                        defered.resolve(1000*dur);
                    }
                    counter++;
                },500);
            } else {
                defered.resole(-1000);
            }
            return defered.promise;
        }
    };
    return player;
});
