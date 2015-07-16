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
            var query= "SELECT t.name AS titleName, t.id AS titleId, t.path AS path, albumName , albumId , artistName FROM"+
                " title t INNER JOIN"+
                " (SELECT ar.name AS artistName, al.name AS albumName, al.id AS albumId FROM"+
                " (SELECT * FROM artist WHERE id=?) ar INNER JOIN album al ON al.artist=ar.id) a"+
                " ON t.album=a.albumId ORDER BY albumName";
            return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {
                console.log('Got '+res.rows.length+' titles');
                console.dir(res.rows.item(0));
                var albums=[];
                var viewPlaylist=[];
                var i = 0;
                while (i<res.rows.length){
                    var currentAlbumId=res.rows.item(i).albumId;
                    var currentAlbum={name: res.rows.item(i).albumName, id : res.rows.item(i).albumId};
                    var titles= [];
                    while (i<res.rows.length && res.rows.item(i).albumId==currentAlbumId){
                        titles.push({name:res.rows.item(i).titleName, id: res.rows.item(i).titleId});
                        viewPlaylist.push({name:res.rows.item(i).titleName, album: res.rows.item(i).albumName,artist : res.rows.item(i).artistName, path : res.rows.item(i).path ,id: res.rows.item(i).titleId});
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
                        return $cordovaSQLite.execute(dbService.db,"INSERT INTO title (name,album,track,year,path) VALUES (?,?,?,?,?)", [title.title,albumId,title.track,title.year,title.path]);
                    })
                    .then(function(res) {
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
                        file=file.slice(-300);
                        ID3.loadTags(fileName,function() {
                            var tags   = ID3.getAllTags(fileName);
                            var title  = tags.title || name;
                            var artist = tags.artist || 'Unknown Artist';
                            var album  = tags.album || 'Unknown Album';
                            var track  = tags.track || 1;
                            var currentTitle={title:title,album: album, artist:artist,track:track,year:tags.year,path:entry.nativeURL};
                            results.push(currentTitle);
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
        onUpdate:null,
        onTitleChange:null,
        isWatchingTime: null,
        duration:0,
        media: null,
        playlist: [{artist:'Muse',title:'Time is Running Out',path:'file:///storage/emulated/0/Music/My_music/Fold.mp3'}],
        viewPlaylist: [],
        playlistIndex: 0,
        volume: 70,
        setVolume: function() {
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
        initMedia: function(index) {
            var self=this;
            self.clearMedia();
            console.log('init media');
            self.playlistIndex=index;
            var mypath=this.playlist[index].path;
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
        // player launcher for the controller
        launchPlayer: function(index,updateCb,newSongCb) {
            var self=this;
            self.loadPlaylist();
            self.onUpdate=updateCb;
            self.onTitleChange=newSongCb;
            self.initMedia(index);
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
                        self.playlistIndex = (self.playlistIndex - 1) % self.playlist.length;
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
                        if (pos>=self.duration-0.6){
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
