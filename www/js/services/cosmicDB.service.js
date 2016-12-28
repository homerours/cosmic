// App database service
angular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLite, $cordovaFile,cosmicConfig,imageService,onlineArtwork) {
    var database={
        db: null,
        initDatabase: function(){
            console.log("INIT DATABASE");
            //this.db = $cordovaSQLite.openDB({name: 'cosmic.db'});
            this.db = window.sqlitePlugin.openDatabase({name: 'demo.db', location: 'default'});
            this.playlistQueries = this.specialPlaylistQueries();
            this.createTables();
        },

        createTables : function(){
            var self=this;
            var promises = [];
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artist (id integer primary key autoincrement, name text)"));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS album (id integer primary key autoincrement, name text, artist integer, artwork integer default 1)"));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS title (id integer primary key autoincrement, name text, album integer, track integer, year integer,path text, add_time datetime DEFAULT CURRENT_TIMESTAMP, last_play datetime, nb_played integer DEFAULT 0, like integer DEFAULT 0, like_time datetime DEFAULT CURRENT_TIMESTAMP)"));

            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artwork (id integer primary key autoincrement, file_name text unique)").then(function(res){
                return $cordovaSQLite.execute(self.db, "INSERT OR REPLACE INTO artwork (id,file_name) VALUES (1,?)",['default_artwork.jpg']).then(function(){
                    $cordovaSQLite.execute(self.db, "SELECT * from artwork",[]).then(function(res){
                        console.log('got all artworks');
                        var artworks=new Array(res.rows.length);
                        for (var i=0; i < res.rows.length; ++i){
                            artworks[i]=res.rows.item(i);
                        }
                    });

                });
            }));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS playlist (id integer primary key autoincrement, name text)"));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS playlist_item (playlist integer, title integer, position integer)"));
            return $q.all(promises);


        },

        flushDatabase: function(){
            // clear Database
            var self=this;
            var promises = [];
            promises.push($cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS artist"));
            promises.push($cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS album"));
            promises.push($cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS title"));
            promises.push($cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS artwork"));
            promises.push($cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS playlist"));
            promises.push($cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS playlist_item"));
            promises.push(self.createTables());
            return $q.all(promises);

        },
        // delete all artworks files
        removeAllArtworks : function(){
            console.log('Remove all artworks !');
            var d=$q.defer();
            $cordovaSQLite.execute(this.db, "SELECT file_name FROM artwork WHERE id>1",[]).then(function(res){
                console.log('got all artworks');
                var promises=[];
                var artworkDir = cosmicConfig.appRootStorage + 'artworks/';
                var miniaturesDir = cosmicConfig.appRootStorage + 'miniatures/';
                for (var i=0; i < res.rows.length; ++i){
                    promises.push($cordovaFile.removeFile(artworkDir,res.rows.item(i).file_name));
                    promises.push($cordovaFile.removeFile(miniaturesDir,res.rows.item(i).file_name));
                }
                $q.all(promises).then(function(res){
                    d.resolve();
                },function(err){
                    console.log('Error while removing all artworks');
                    console.error(err);
                    d.resolve();
                });
            },function(err){
                console.log(err);
                d.resolve();
            });
            return d.promise;
        },

        getArtists: function(){
            // Get all artists from database
            var query = "SELECT artist.name AS name, artist.id AS id, MAX(artwork.id) AS albumId, COUNT(alb.id) AS nbAlbums,"+
                " SUM(alb.nbTitles) AS nbTitles, SUM(alb.like) AS like, artwork.file_name AS artwork"+
                " FROM artist INNER JOIN"+
                " (SELECT COUNT(title.id) AS nbTitles, SUM(title.like) AS like, album.id AS id, album.artwork, album.artist FROM album INNER JOIN title ON title.album=album.id GROUP BY title.album) alb"+
                " ON artist.id = alb.artist"+
                " INNER JOIN artwork ON alb.artwork = artwork.id GROUP BY alb.artist ORDER BY artist.name COLLATE NOCASE";
            return $cordovaSQLite.execute(this.db,query, []).then(function(res) {
                var artists=new Array(res.rows.length);
                for (var i=0; i < res.rows.length; ++i){
                    artists[i]=res.rows.item(i);
                }
                return artists;
            });
        },

        getTitles:  function(artistId){
            // Get all titles from artist
            var query= "SELECT title.name AS name, title.id AS id, title.like AS like, title.track AS track, title.path AS path,"+
                " artwork.file_name AS artwork, album.name AS album,"+
                " album.id AS albumId , arti.artist AS artist FROM"+
                " (SELECT  artist.name AS artist, artist.id FROM artist WHERE id=?) arti INNER JOIN"+
                " album ON album.artist = arti.id INNER JOIN"+
                " title ON title.album = album.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id ORDER BY album.name,title.track";

            return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {
                var titles=[]; // For the scope
                var viewPlaylist=new Array(res.rows.length); // For the player service
                var i = 0;
				var i0=0;
                while (i<res.rows.length){
                    var currentAlbumId=res.rows.item(i).albumId;
					titles.push({isSeparator : true, name: res.rows.item(i).album, id : res.rows.item(i).albumId, artwork : res.rows.item(i).artwork});
					i0=i;
                    while (i<res.rows.length && res.rows.item(i).albumId==currentAlbumId){
                        var item = res.rows.item(i);
						item.first = (i===i0);
                        viewPlaylist[i]=item;
                        titles.push(item);
                        i++;
                    }
                }
                return {titles : titles, playlist : viewPlaylist};
            },function(err){
                console.log('error');
                console.dir(err);
            });
        },

        getArtistId: function(artistName){
            var dbService=this;
            return $cordovaSQLite.execute(dbService.db, "SELECT * FROM artist WHERE LOWER(name)=?", [artistName.toLowerCase()]).then(function(res) {
                if (res.rows.length>0){
                    // Existing artist
                    return res.rows.item(0).id;
                } else {
                    // No artist
                    return 0;
                }
            });

        },

        getAlbumId: function(albumName,artistId){
            var dbService=this;
            return $cordovaSQLite.execute(dbService.db, "SELECT * FROM album WHERE LOWER(name)=? AND artist=?", [albumName.toLowerCase(),artistId]).then(function(res) {
                if (res.rows.length>0){
                    // Existing album
                    return res.rows.item(0);
                } else {
                    // No album
                    return undefined;
                }
            });
        },
        addArtist: function(artistName){
            var dbService=this;
            return dbService.getArtistId(artistName).then(function(artistId){
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
        addAlbum: function(albumName,artistId,albumCover){
            var defered=$q.defer();
            var dbService=this;
            dbService.getAlbumId(albumName,artistId).then(function(album){
                if (!album){
                    // New album
                    if (albumCover){ // Store cover
                        dbService.addArtworkScan(albumCover).then(function(artworkId){
                            $cordovaSQLite.execute(dbService.db,"INSERT INTO album (name,artist,artwork) VALUES (?,?,?)", [albumName,artistId,artworkId]).then(function(res) {
                                console.log('insert album '+albumName+' with id '+res.insertId+' for artistid '+artistId);
                                defered.resolve(res.insertId);
                            });
                        });
                    } else {
                        $cordovaSQLite.execute(dbService.db,"INSERT INTO album (name,artist) VALUES (?,?)", [albumName,artistId]).then(function(res) {
                            console.log('insert album '+albumName+' with id '+res.insertId+' for artistid '+artistId);
                            defered.resolve(res.insertId);
                        });
                    }
                } else {
                    if (albumCover && album.artwork==1){ // Store cover
                        dbService.addArtworkScan(albumCover).then(function(artworkId){
                            $cordovaSQLite.execute(dbService.db,"UPDATE album SET artwork = ? WHERE id = ?", [artworkId,album.id]).then(function(res) {
                                console.log('Updated album cover');
                                defered.resolve(album.id);
                            });
                        });
                    } else {
                        defered.resolve(album.id);
                    }
                }
            });
            return defered.promise;
        },

        addTitle: function(title){
            var defered=$q.defer();
            var dbService=this;
            $cordovaSQLite.execute(dbService.db,"SELECT id FROM title WHERE path=?", [title.path]).then(function(res) {
                if (res.rows.length===0){
                    dbService.addArtist(title.artist).then(function(artistId){
                        return dbService.addAlbum(title.album,artistId,title.artwork);
                    })
                    .then(function(albumId){
                        // Inserting new title
                        return $cordovaSQLite.execute(dbService.db,"INSERT INTO title (name,album,track,year,path) VALUES (?,?,?,?,?)", [title.title,albumId,title.track,title.year,title.path]);
                    })
                    .then(function(res) {
                        if (title.artwork){
                            $cordovaFile.removeFile(cosmicConfig.appRootStorage+ 'tmp/', title.artwork);
                        }
                        defered.resolve(res.insertId);
                    }, function (err){
                        console.log('Error inserting title: '+err);
                        defered.reject(err);
                    });

                } else {
                    // No title
                    defered.resolve(0);
                }
            });
            return defered.promise;
        },

        updateArtistName : function(artist){
            var defered=$q.defer();
            var self=this;
            $cordovaSQLite.execute(self.db,"SELECT id FROM artist WHERE name=? AND id!=?", [artist.name,artist.id]).then(function(res0) {
                if (res0.rows.length===0){
                    $cordovaSQLite.execute(self.db,"UPDATE artist SET name = ? WHERE id = ?", [artist.name,artist.id]).then(function() {
                        defered.resolve(artist.id);
                    });
                } else if (res0.rows.length === 1){
                    console.log('Artist collision');
                    var artistId2 = res0.rows.item(0).id;
                    var query = "SELECT art1.id AS id1, art1.artwork AS artwork1, art2.artwork AS artwork2 FROM"+
                        " (SELECT name, id, artwork FROM album WHERE artist = ?) art1 INNER JOIN"+
                        " (SELECT name, id, artwork FROM album WHERE artist = ?) art2 ON art1.name = art2.name";
                    // find duplicates albums
                    $cordovaSQLite.execute(self.db,query, [artist.id,artistId2]).then(function(res) {
                        // artist fusion
                        $cordovaSQLite.execute(self.db,"UPDATE album SET artist = ? WHERE artist = ?", [artistId2,artist.id]).then(function() {
                            $cordovaSQLite.execute(self.db,"DELETE FROM artist WHERE id = ?", [artist.id]).then(function() {
                                console.log('synch');
                                var syncLoop = function(i){
                                    if (i>= res.rows.length){
                                        defered.resolve(artistId2);
                                    } else {
                                        var item = res.rows.item(i);
                                        var deletedAlbumId = item.id1;
                                        var remainingAlbumId = item.id2;
                                        if (item.artwork1 > 1){
                                            deletedAlbumId = item.id2;
                                            remainingAlbumId = item.id1;
                                        }
                                        $cordovaSQLite.execute(self.db,"DELETE FROM album WHERE id=?", [deletedAlbumId]).then(function() {
                                            $cordovaSQLite.execute(self.db,"UPDATE title SET album=? WHERE album=?", [remainingAlbumId,deletedAlbumId]).then(function() {
                                                i++;
                                                syncLoop(i);
                                            });
                                        });
                                    }
                                };
                                syncLoop(0);
                            });
                        });
                    },function(err){
                        console.log('Error: '+err);
                        defered.reject(err);
                    });
                } else {
                    defered.reject("two artists with same names");
                }
            });
            return defered.promise;

        },
        // Download missing album covers from the iTunes API
        downloadArtworks : function(albums){
            var self=this;
            var query;
            if (albums === 'all'){
                query = "SELECT artist.name AS artist, album.id AS albumId, album.name AS album, MAX(title.name) AS title FROM album"+
                    " INNER JOIN artist ON artist.id = album.artist"+
                    " INNER JOIN title ON title.album = album.id GROUP BY album.id";
            } else {
                query = "SELECT artist.name AS artist, album.id AS albumId, album.name AS album, MAX(title.name) AS title FROM album"+
                    " INNER JOIN artist ON artist.id = album.artist"+
                    " INNER JOIN title ON title.album = album.id WHERE album.artwork=1 GROUP BY album.id";
            }
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,query, []).then(function(res) {
                var promises=[];
                var results=[];
                console.log('Got '+res.rows.length +' albums without cover');
                for (i=0; i<res.rows.length; i++){
                    //console.log(res.rows.item(i));
                    promises.push(self.downloadArtwork(res.rows.item(i),results));
                }
                $q.all(promises).then(function(){
                    console.log('Download finished');
                    var syncLoop = function(i){
                        if (i>= results.length){
                            d.resolve(results.length);
                        } else {
                            self.addArtwork(results[i].artworkFile).then(function(artworkId){
                                self.addArtworkToAlbum(results[i].albumId,artworkId).then(function(){
                                    i++;
                                    syncLoop(i);
                                });
                            });
                        }
                    };
                    syncLoop(0);
                },function(error){
                    console.log(error);
                    d.reject(error);
                });
            });
            return d.promise;

        },
        // Use artist names from itunes API
        correctArtistNames : function(){
            var self=this;
            var query = "SELECT name, id FROM artist";
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,query, []).then(function(res) {
                var promises=[];
                var results=[];
                for (i=0; i<res.rows.length; i++){
                    promises.push(self.findArtistName(res.rows.item(i),results));
                }
                $q.all(promises).then(function(){
                    var syncLoop = function(i){
                        if (i>= results.length){
                            d.resolve(results.length);
                        } else {
                            self.updateArtistName(results[i]).then(function(){
                                i++;
                                syncLoop(i);
                            });
                        }
                    };
                    syncLoop(0);
                },function(err){
                    d.reject(err);
                });
            });
            return d.promise;

        },

        findArtistName : function(artist,results){
            var d=$q.defer();
            onlineArtwork.correctArtistNameFromItunes(artist.name).then(function(itunesArtist){
                if (artist.name !== itunesArtist){
                    results.push({id : artist.id, name : itunesArtist});
                }
                d.resolve();
            },function(error){
                console.log(error);
                d.resolve();
            });
            return d.promise;
        },

        downloadArtwork : function(item,results){
            var d=$q.defer();
            var self = this;
            onlineArtwork.downloadArtworkFromItunes(item).then(function(fileName){
                results.push({albumId : item.albumId, artworkFile : fileName});
                d.resolve();
            }, function(error){
                console.log(error);
                d.resolve();
            });

            return d.promise;

        },
        addArtworkToAlbum : function(albumId,artworkId){
            var self=this;
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,"UPDATE album SET artwork=? WHERE id=?", [artworkId,albumId]).then(function() {
                console.log('album '+ albumId + ' update, artwork = '+artworkId);
                d.resolve();
            });
            return d.promise;
        },
        addArtwork : function(fileName){
            var self=this;
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,"INSERT INTO artwork (file_name) VALUES (?)", [fileName]).then(function(res) {
                console.log("INSERT ARTWORK ID -> " + res.insertId);
                d.resolve(res.insertId);
            });
            return d.promise;
        },

        addArtworkScan: function(fileName){
            var self=this;
            var defered=$q.defer();
            if (fileName){
                self.addArtwork(fileName).then(function(insertId) {
                    // move temporary artwork files to the storage directory
                    var dataPath = cosmicConfig.appRootStorage;
                    $cordovaFile.moveFile(dataPath+'tmp/',fileName,dataPath + 'artworks/',fileName).then(function(){
                        imageService.makeMiniature(fileName).then(function(){
                            defered.resolve(insertId);
                        },function(error){
                            $cordovaFile.copyFile(dataPath+'artworks/',fileName,dataPath + 'miniatures/',fileName).then(function(){
                                console.log('Unable to create miniature:  the full image will be used as miniature');
                                defered.resolve(insertId);
                            });
                        });
                    });
                });
            } else {
                defered.resolve(1);
            }
            return defered.promise;
        },
        addTitleList : function(titleList){
            var self=this;
            var d=$q.defer();
            var syncLoop = function(i){
                if (i>= titleList.length){
                    d.resolve();
                } else {
                    self.addTitle(titleList[i]).then(function(){
                        i++;
                        syncLoop(i);
                    });
                }
            };
            syncLoop(0);
            return d.promise;
        },
        isInDatabase : function(path){
            var self=this;
            return $cordovaSQLite.execute(self.db,"SELECT id FROM title WHERE path=?", [path]).then(function(res) {
                return (res.rows.length == 1);
            });
        },
        addPlaylist : function (playlistName){
            console.log('Add playlist');
            var self=this;
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,"SELECT id FROM playlist WHERE name=?", [playlistName]).then(function(res) {
                console.log('check done');
                if (res.rows.length > 0){
                    d.reject('This playlist name is already used !');
                } else {
                    console.log('Playlist name ok');
                    $cordovaSQLite.execute(self.db,"INSERT INTO playlist (name) VALUES (?)", [playlistName]).then(function(res) {
                        d.resolve(res.insertId);
                    });
                }
            });
            return d.promise;
        },
        addTitleToPlaylist : function(playlistId, titleId){
            var self=this;
            console.log('add title '+titleId +' to playlist '+playlistId);
            return $cordovaSQLite.execute(self.db,"SELECT COUNT(*) AS playlistSize FROM playlist_item WHERE playlist=?", [playlistId]).then(function(res){
                return $cordovaSQLite.execute(self.db,"INSERT INTO playlist_item (playlist,title,position) VALUES (?,?,?)", [playlistId,titleId,res.rows.item(0).playlistSize]);
            },function(err){
                console.error(err);
            });
        },
        // Get all playlists
        getPlaylistsNames : function(){
            var self=this;
            var d=$q.defer();

            $cordovaSQLite.execute(self.db,"SELECT * FROM playlist ORDER BY name COLLATE NOCASE", []).then(function(res){
                var playlists=[];
                for (var i=0; i< res.rows.length; i++){
                    playlists.push(res.rows.item(i));
                }
                console.log(playlists);
                d.resolve(playlists);
            },function(err){
                console.log(err);
                d.reject(err);
            });
            return d.promise;
        },
        getSpecialPlaylists : function(nbTitles){
            var self=this;
            var d = $q.defer();
            var specialPlaylists=[];

            var syncLoop = function(i){
                if (i>= self.playlistQueries.length){
                    d.resolve(specialPlaylists);
                } else {
                    self.getSpecialPlaylist(i,nbTitles).then(function(res){
                        specialPlaylists.push(res);
                        i++;
                        syncLoop(i);
                    });
                }
            };
            syncLoop(0);

            return d.promise;

        },
        getSpecialPlaylist : function(nbPlaylist,nbTitles){
            var self=this;
            var d = $q.defer();
            var query = self.playlistQueries[nbPlaylist];
            $cordovaSQLite.execute(self.db,query.query,[nbTitles]).then(function(res){
                var playlist=new Array(res.rows.length);
                for (var j=0; j<res.rows.length; j++){
                    playlist[j]=res.rows.item(j);
                }
                d.resolve({name : query.name, titles : playlist});
            },function(err){
                console.error(err);
                d.reject(err);
            });

            return d.promise;
        },
        specialPlaylistQueries : function(){
            var queries = [];
            var query;

            // Last Added
            query = "SELECT song.name AS name, song.id AS id, song.path AS path, song.like AS like, artwork.file_name AS artwork, album.name AS albumName,"+
                " album.id AS albumId , artist.name AS artist FROM"+
                " (SELECT * FROM title ORDER BY add_time DESC LIMIT ?) song INNER JOIN"+
                " album ON song.album = album.id INNER JOIN"+
                " artist ON album.artist = artist.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id";
            queries.push({name : "Last Added", query : query});

            // Likes
            query = "SELECT song.name AS name, song.id AS id, song.path AS path, song.like AS like, artwork.file_name AS artwork, album.name AS albumName,"+
                " album.id AS albumId , artist.name AS artist FROM"+
                " (SELECT * FROM title WHERE like = 1 ORDER BY like_time DESC LIMIT ?) song INNER JOIN"+
                " album ON song.album = album.id INNER JOIN"+
                " artist ON album.artist = artist.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id";
            queries.push({name : "Favorites", query : query});

            // Top played
            query = "SELECT song.name AS name, song.id AS id, song.path AS path, song.like AS like, artwork.file_name AS artwork, album.name AS albumName,"+
                " album.id AS albumId , artist.name AS artist FROM"+
                " (SELECT * FROM title ORDER BY nb_played DESC LIMIT ?) song INNER JOIN"+
                " album ON song.album = album.id INNER JOIN"+
                " artist ON album.artist = artist.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id";
            queries.push({name : "Top Played", query : query});


            query = "SELECT song.name AS name, song.id AS id, song.path AS path, song.like AS like, artwork.file_name AS artwork, album.name AS albumName,"+
                " album.id AS albumId , artist.name AS artist FROM"+
                " (SELECT * FROM title ORDER BY last_play DESC LIMIT ?) song INNER JOIN"+
                " album ON song.album = album.id INNER JOIN"+
                " artist ON album.artist = artist.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id";
            queries.push({name : "Last Played", query : query});
            return queries;
        },
        // Get all playlists
        getPlaylists : function(){
            var self=this;
            var d=$q.defer();

            var query="SELECT playlist.id AS id, playlist.name AS name, IFNULL(artwork.file_name,'default_artwork.jpg') AS artwork,"+
                " IFNULL(c.like, 0) AS like, IFNULL(c.nbTitles, 0) AS nbTitles, IFNULL(playlist_item.position, 0) AS position FROM playlist LEFT OUTER JOIN"+
                " (SELECT COUNT(*) AS nbTitles, SUM(title.like) AS like, playlist_item.playlist AS playlist FROM playlist_item"+
                " INNER JOIN title ON title.id=playlist_item.title GROUP BY playlist_item.playlist) c ON c.playlist = playlist.id LEFT OUTER JOIN"+
                " playlist_item ON playlist_item.playlist = playlist.id LEFT OUTER JOIN"+
                " title ON title.id = playlist_item.title LEFT OUTER JOIN"+
                " album ON album.id = title.album LEFT OUTER JOIN"+
                " artwork ON artwork.id = album.artwork WHERE position < 4 OR position IS NULL ORDER BY name,id,position";
            $cordovaSQLite.execute(self.db,query, []).then(function(res){
                var playlists=[];
                var i = 0;
                while (i<res.rows.length){
                    var currentPlaylistId=res.rows.item(i).id;
                    var currentPlaylist={name: res.rows.item(i).name, id : res.rows.item(i).id, nbTitles : res.rows.item(i).nbTitles, like :res.rows.item(i).like};
                    var artworks= [];
                    while (i<res.rows.length && res.rows.item(i).id==currentPlaylistId){
                        artworks.push(res.rows.item(i).artwork);
                        i++;
                    }
                    while (artworks.length <4){
                        artworks.push('default_artwork.jpg');
                    }
                    currentPlaylist.artworks=artworks;
                    playlists.push(currentPlaylist);
                }
                d.resolve(playlists);
            },function(err){
                console.log(err);
                d.reject(err);
            });
            return d.promise;
        },

        // Get songs from a playlist
        getPlaylistItems : function(playlistId){
            var self=this;
            var d=$q.defer();

            var query= "SELECT title.name AS name, title.id AS id, title.path AS path, title.like AS like, artwork.file_name AS artwork, album.name AS albumName,"+
                " album.id AS albumId , artist.name AS artist, items.position AS position FROM"+
                " (SELECT * from playlist_item WHERE playlist = ?) items INNER JOIN"+
                " title ON items.title = title.id INNER JOIN"+
                " album ON title.album = album.id INNER JOIN"+
                " artist ON album.artist = artist.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id"+
                " ORDER BY items.position";
            $cordovaSQLite.execute(self.db,query, [playlistId]).then(function(res){
                var playlist=new Array(res.rows.length);
                for (var i=0; i<res.rows.length; i++){
                    playlist[i]=res.rows.item(i);
                }
                d.resolve(playlist);
            },function(err){
                console.error(err);
            });
            return d.promise;
        },

        removeTitleFromPlaylist : function(playlistId,titlePosition){
            console.log('Remove position '+titlePosition+' from playlist '+playlistId);
            var self=this;
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,"DELETE from playlist_item WHERE playlist = ? AND position = ?", [playlistId,titlePosition]).then(function(res){
                $cordovaSQLite.execute(self.db,"UPDATE playlist_item SET position = (position - 1) WHERE playlist = ? AND position > ?", [playlistId,titlePosition]).then(function(res){
                    d.resolve();
                },function(err){
                    console.error(err);
                });
            },function(err){
                console.error(err);
            });
            return d.promise;
        },
        // Delete playlist
        deletePlaylist : function(playlistId){
            var self=this;
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,"DELETE from playlist_item WHERE playlist = ?", [playlistId]).then(function(res){
                $cordovaSQLite.execute(self.db,"DELETE FROM playlist WHERE id = ?", [playlistId]).then(function(res){
                    d.resolve();
                },function(err){
                    console.error(err);
                });
            },function(err){
                console.error(err);
            });
            return d.promise;
        },
        // search in the whole music database
        search : function(term){
            var words = term.split(' ');
            var self=this;
            var d=$q.defer();
            var query= "SELECT title.name AS name, title.id AS id, title.nb_played, title.path AS path, title.like AS like, artwork.file_name AS artwork, album.name AS album,"+
                " album.id AS albumId , artist.name AS artist, title.name || ' ' || artist.name || ' ' || album.name AS search_field FROM title"+
                " INNER JOIN album ON album.id = title.album"+
                " INNER JOIN artist ON artist.id = album.artist"+
                " INNER JOIN artwork ON album.artwork = artwork.id"+
                " WHERE";
            for (var i=0; i<words.length; i++){
                if (i>0){
                    query += ' AND';
                }
                query += ' search_field LIKE ?';
                words[i]='%'+words[i].replace(/\s/g, '')+'%';
            }
            query += ' ORDER BY title.nb_played DESC LIMIT 20';
            $cordovaSQLite.execute(self.db,query, words).then(function(res){
                var titles=new Array(res.rows.length);
                for (var i=0; i< res.rows.length; i++){
                    titles[i]=res.rows.item(i);
                }
                d.resolve(titles);

            },function(err){
                console.error(err);
            });
            return d.promise;

        },
        updateTitlePlayStatistics : function(titleId){
            $cordovaSQLite.execute(this.db,"UPDATE title SET nb_played = nb_played + 1, last_play = CURRENT_TIMESTAMP WHERE id=?", [titleId]);
        },
        toggleLikeTitle : function(titleId){
            return $cordovaSQLite.execute(this.db,"UPDATE title SET like = 1 - like, like_time = CURRENT_TIMESTAMP WHERE id=?", [titleId]);
        }
    };
    database.initDatabase();
    return database;
});

