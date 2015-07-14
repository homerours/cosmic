var cosmicMobileServices = angular.module('cosmic.services', ['ngCordova']);

cosmicMobileServices.factory('cosmicDB',  function($q,$cordovaSQLite) {
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
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artist (id integer primary key autoincrement, name text)");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS album (id integer primary key autoincrement, name text, artist integer)");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS title (id integer primary key autoincrement, name text, album integer, track integer, year integer,path text)");
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
            var query= "SELECT t.name AS titleName, t.id AS titleId, albumName , albumId , artistName FROM"+
                " title t INNER JOIN"+
                " (SELECT ar.name AS artistName, al.name AS albumName, al.id AS albumId FROM"+
                " (SELECT * FROM artist WHERE id=?) ar INNER JOIN album al ON al.artist=ar.id) a"+
                " ON t.album=a.albumId ORDER BY albumName";
            return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {
                console.log('Got '+res.rows.length+' titles');
                console.dir(res.rows.item(0));
                var albums=[];
                var i = 0;
                while (i<res.rows.length){
                    var currentAlbumId=res.rows.item(i).albumId;
                    var currentAlbum={name: res.rows.item(i).albumName};
                    var titles= [];
                    while (i<res.rows.length && res.rows.item(i).albumId==currentAlbumId){
                        titles.push({name:res.rows.item(i).titleName, id: res.rows.item(i).titleId});
                        i++;
                    }
                    currentAlbum.titles=titles;
                    albums.push(currentAlbum);
                }
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

        addTitle: function(title,artist,album,track,year,path){
            var dbService=this;
            return $cordovaSQLite.execute(dbService.db,"SELECT * FROM title WHERE path=?", [path]).then(function(res) {
                if (res.rows.length===0){
                    dbService.addArtist(artist).then(function(artistId){
                        return dbService.addAlbum(album,artistId);
                    })
                    .then(function(albumId){
                        // Inserting new title
                        return $cordovaSQLite.execute(dbService.db,"INSERT INTO title (name,album,track,year,path) VALUES (?,?,?,?,?)", [title,albumId,track,year,path]);
                    })
                    .then(function(res) {
                        return res.insertId;
                    }, function (err){
                        console.dir(err);
                    });

                } else {
                    // No title
                    return 0;
                }
            });


        }
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
        handleItem : function(entry,results){
            var extensionsAudio=['mp3','m4a'];
            var myfs=this;
            var hDeferred=$q.defer();
            var fileName = entry.name;
            console.log('exploring '+fileName);
            var extension=fileName.substr(fileName.lastIndexOf('.')+1);
            var name=fileName.substr(0,fileName.lastIndexOf('.'));
            // Audio file
            if (entry.isFile) {
                if (extensionsAudio.indexOf(extension)!=-1){
                    entry.file(function(file){
                        ID3.loadTags(fileName,function() {
                            var tags   = ID3.getAllTags(fileName);
                            var title  = tags.title || name;
                            var artist = tags.artist || 'Unknown Artist';
                            var album  = tags.album || 'Unknown Album';
                            var track  = tags.track || 1;
                            results.push({title:title,artist:artist,track:track,year:tags.year,path:entry.nativeUrl});
                            console.log(title);
                            //console.dir({title:title,artist:artist,track:track,year:tags.year,path:entry.nativeUrl});
                            hDeferred.resolve();
                            //return hDeferred.promise;
                            //cosmicDB.addTitle(title,artist,album,track,tags.year,entry.nativeUrl);
                        },{
                            dataReader:FileAPIReader(file),
                            onError: function(reason) {
                                if (reason.error === "xhr") {
                                    console.log("There was a network error: ", reason.xhr);
                                }
                                hDeferred.reject(reason);
                            }
                        });

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
                });
            });
            return d.promise;
        },
        startScan: function(){
            var path="file:///storage/emulated/0/Music/My_music/";
            var results=[];
            this.scanDirectory(path,results).then(function(res){
                console.dir(results);
                console.log('DONE');
            },function(err){
                console.error(err);
            });
        }

    };

    return File;

});

cosmicMobileServices.factory('cosmicPlayer',  function($q,$cordovaMedia) {
    var player = {
        playing: false,
        media: null,
        playlist: [{artist:'Muse',title:'Time is Running Out',path:'ressource////'}],
        viewPlaylist: [],
        playlistIndex: 0,
        volume: 0.7,
        setVolume: function() {
            this.media.setVolume(this.volume);
        },
        loadPlaylist: function() {
            player.playlist = player.viewPlaylist;
        },
        loadViewPlaylist: function(playlist) {
            player.viewPlaylist = playlist;
        },
        initMedia: function() {
            var deferred=$q.defer();
            if (this.playlist.length>0){
                this.media=$cordovaMedia.newMedia(this.playlist[0].path).then(function(res){
                    console.log('Media opened');
                    deferred.resolve();
                },function(err){
                    console.error(err);
                    deferred.reject(err);
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        },
        clearMedia: function(){
            if (this.media){
                this.media.release();
                this.media=null;
            }
        },
        initAndPlay: function(index) {
            this.clearMedia();
            this.initMedia(function(){
                this.play();
            });
        },
        play: function() {
            this.media.play();
            player.playing = true;
        },
        pause: function() {
            this.media.pause();
            player.playing = false;
        },
        stop: function() {
            this.media.stop();
            player.playing = false;
        },
        seek: function(percent) {
            console.log(percent);
            this.media.seekTo(1000 * percent * this.media.getDuration());
        },
        next: function() {
            this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
            this.initAndPlay();
        },
        currentTime: function() {
            return this.media.getCurrentPosition();
        },
        currentDuration: function() {
            return this.media.getDuration();
        }
    };
    //audio.addEventListener('timeupdate', function(evt) {
    //$rootScope.$apply(function() {
    //player.progress = player.currentTime();
    //player.progress_percent = 100 * player.progress / player.currentDuration();
    //});
    //});
    //audio.addEventListener('ended', function() {
    //$rootScope.$apply(player.next());
    //});
    //audio.addEventListener('canplay', function(evt) {
    //$rootScope.$apply(function() {
    //player.ready = true;
    //// player.progress = player.currentTime();
    //});
    //});
    return player;
});
