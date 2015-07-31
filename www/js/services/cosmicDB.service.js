angular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLite, cosmicPlayer,$cordovaFile,cosmicConfig,imageService,onlineArtwork) {
    var database={
        db: null,
        initDatabase: function(){
            console.log("INIT DATABASE");
            this.db = $cordovaSQLite.openDB("cosmic");
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
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artist (id integer primary key autoincrement, name text)"));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS album (id integer primary key autoincrement, name text, artist integer, artwork integer default 1)"));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS title (id integer primary key autoincrement, name text, album integer, track integer, year integer,path text)"));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artwork (id integer primary key autoincrement, file_name text)").then(function(){
                return $cordovaSQLite.execute(self.db, "INSERT INTO artwork (file_name) VALUES (?)",['default_artwork.jpg']);
            }));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS playlist (id integer primary key autoincrement, name text)"));
            promises.push($cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS playlist_item (playlist integer, title integer, position integer)"));
            return $q.all(promises);

        },
        removeAllArtworks : function(){
            var d=$q.defer();
            $cordovaSQLite.execute(this.db, "SELECT file_name FROM artwork WHERE id>1",[]).then(function(res){
                var promises=[];
                var artworkDir = cosmicConfig.appRootStorage + 'artworks/';
                for (var i=0; i < res.rows.length; ++i){
                    promises.push($cordovaFile.removeFile(artworkDir,res.rows.item(i).file_name));
                }
                //$q.all(promises).then(function(res){
                d.resolve();
                //});
            });
            return d.promise;
        },

        getArtists: function(){
            // Get all artists from database
            var query = "SELECT artist.name AS name, artist.id AS id, MAX(artwork.id) AS albumId, COUNT(alb.id) AS nbAlbums,"+
                " SUM(alb.nbTitles) AS nbTitles, artwork.file_name AS artwork"+
                " FROM artist INNER JOIN"+
                " (SELECT COUNT(title.id) AS nbTitles, album.id AS id, album.artwork, album.artist FROM album INNER JOIN title ON title.album=album.id GROUP BY title.album) alb"+
                " ON artist.id = alb.artist"+
                " INNER JOIN artwork ON alb.artwork = artwork.id GROUP BY alb.artist ORDER BY artist.name";
            return $cordovaSQLite.execute(this.db,query, []).then(function(res) {
                var artists=[];
                for (var i=0; i < res.rows.length; ++i){
                    artists.push(res.rows.item(i));
                }
                return artists;
            });
        },

        getTitles:  function(artistId){
            // Get all titles from artist
            var query= "SELECT title.name AS name, title.id AS id, title.track, title.path AS path, artwork.file_name AS artwork, album.name AS album,"+
                " album.id AS albumId , arti.artist AS artist FROM"+
                " (SELECT  artist.name AS artist, artist.id FROM artist WHERE id=?) arti INNER JOIN"+
                " album ON album.artist = arti.id INNER JOIN"+
                " title ON title.album = album.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id ORDER BY album.name,title.track";
            return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {
                console.log('Got '+res.rows.length+' titles');
                console.dir(res.rows.item(0));
                var albums=[]; // For the scope
                var viewPlaylist=[]; // For the player service
                var i = 0;
                while (i<res.rows.length){
                    var currentAlbumId=res.rows.item(i).albumId;
                    var currentAlbum={name: res.rows.item(i).album, id : res.rows.item(i).albumId, artwork : res.rows.item(i).artwork};
                    var titles= [];
                    while (i<res.rows.length && res.rows.item(i).albumId==currentAlbumId){
                        var item = res.rows.item(i);
                        viewPlaylist.push(item);
                        item.index = i;// Index is the position of the song in the playlist
                        titles.push(item);
                        i++;
                    }
                    currentAlbum.titles=titles;
                    albums.push(currentAlbum);
                }
                //cosmicPlayer.loadViewPlaylist(viewPlaylist);
                return {albums : albums, playlist : viewPlaylist};
            },function(err){
                console.log('error');
                console.dir(err);
            });
        },

        getArtistId: function(artistName){
            var dbService=this;
            return $cordovaSQLite.execute(dbService.db, "SELECT * FROM artist WHERE name=?", [artistName]).then(function(res) {
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
            return $cordovaSQLite.execute(dbService.db, "SELECT * FROM album WHERE name=? AND artist=?", [albumName,artistId]).then(function(res) {
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
            $cordovaSQLite.execute(dbService.db,"SELECT * FROM title WHERE path=?", [title.path]).then(function(res) {
                if (res.rows.length===0){
                    dbService.addArtist(title.artist).then(function(artistId){
                        return dbService.addAlbum(title.album,artistId,title.artwork);
                    })
                    .then(function(albumId){
                        // Inserting new title
                        return $cordovaSQLite.execute(dbService.db,"INSERT INTO title (name,album,track,year,path) VALUES (?,?,?,?,?)", [title.title,albumId,title.track,title.year,title.path]);
                    })
                    .then(function(res) {
                        console.log(res);
                        console.log('Inserted title '+ title.title);
                        if (title.artwork){
                            $cordovaFile.removeFile(cosmicConfig.appRootStorage+ 'tmp/', title.artwork);
                        }
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
        downloadMissingArtworks : function(){
            var self=this;
            var query = "SELECT artist.name AS artist, album.id AS albumId, album.name AS album FROM album"+
                " INNER JOIN artist ON artist.id = album.artist WHERE album.artwork=1";
            var d=$q.defer();
            $cordovaSQLite.execute(self.db,query, []).then(function(res) {
                var promises=[];
                var results=[];
                console.log('Got '+res.rows.length +' albums without cover');
                for (i=0; i<res.rows.length; i++){
                    promises.push(self.downloadArtwork(res.rows.item(i),results));
                }
                $q.all(promises).then(function(){
                    var syncLoop = function(i){
                        if (i>= results.length){
                            d.resolve();
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
                });
            });
            return d.promise;

        },
        downloadArtwork : function(item,results){
            var d=$q.defer();
            var self = this;
            onlineArtwork.downloadArtworkFromItunes({artist : item.artist, album : item.album}).then(function(fileName){
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

            $cordovaSQLite.execute(self.db,"SELECT * FROM playlist", []).then(function(res){
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
        // Get all playlists
        getPlaylists : function(){
            var self=this;
            var d=$q.defer();

            var query="SELECT playlist.id AS id, playlist.name AS name, IFNULL(artwork.file_name,'default_artwork.jpg') AS artwork, IFNULL(c.nbTitles, 0) AS nbTitles, IFNULL(playlist_item.position, 0) AS position FROM playlist LEFT OUTER JOIN"+
                " (SELECT COUNT(*) AS nbTitles, playlist_item.playlist AS playlist FROM playlist_item GROUP BY playlist_item.playlist) c ON c.playlist = playlist.id LEFT OUTER JOIN"+
                " playlist_item ON playlist_item.playlist = playlist.id LEFT OUTER JOIN"+
                " title ON title.id = playlist_item.title LEFT OUTER JOIN"+
                " album ON album.id = title.album LEFT OUTER JOIN"+
                " artwork ON artwork.id = album.artwork WHERE position < 4 OR position IS NULL ORDER BY name,id,position";
            $cordovaSQLite.execute(self.db,query, []).then(function(res){
                var playlists=[];
                var i = 0;
                while (i<res.rows.length){
                    var currentPlaylistId=res.rows.item(i).id;
                    var currentPlaylist={name: res.rows.item(i).name, id : res.rows.item(i).id, nbTitles : res.rows.item(i).nbTitles};
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
                console.log(playlists);
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

            var query= "SELECT title.name AS name, title.id AS id, title.path AS path, artwork.file_name AS artwork, album.name AS albumName,"+
                " album.id AS albumId , artist.name AS artist, items.position AS position FROM"+
                " (SELECT * from playlist_item WHERE playlist = ?) items INNER JOIN"+
                " title ON items.title = title.id INNER JOIN"+
                " album ON title.album = album.id INNER JOIN"+
                " artist ON album.artist = artist.id INNER JOIN"+
                " artwork ON album.artwork = artwork.id"+
                " ORDER BY items.position";
            $cordovaSQLite.execute(self.db,query, [playlistId]).then(function(res){
                var playlist=[];
                //var viewPlaylist=[];
                for (var i=0; i<res.rows.length; i++){
                    playlist.push(res.rows.item(i));
                }
                //cosmicPlayer.loadViewPlaylist(playlist);
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
        search : function(term){
            var words = term.split(' ');
            var self=this;
            var d=$q.defer();
            var query= "SELECT title.name AS name, title.id AS id, title.track, title.path AS path, artwork.file_name AS artwork, album.name AS album,"+
                " album.id AS albumId , artist.name AS artist, title.name || ' ' || artist.name || ' ' || album.name AS search_field FROM title"+
                " INNER JOIN album ON album.id = title.album"+
                " INNER JOIN artist ON artist.id = album.artist"+
                " INNER JOIN artwork ON album.artwork = artwork.id"+
                " WHERE";//" LIKE ? LIMIT 20";
            for (var i=0; i<words.length; i++){
                if (i>0){
                    query += ' AND';
                }
                query += ' search_field LIKE ?';
                words[i]='%'+words[i].replace(/\s/g, '')+'%';
            }
            query += ' LIMIT 20';
            console.log(query);
            $cordovaSQLite.execute(self.db,query, words).then(function(res){
                var titles=[];
                for (var i=0; i< res.rows.length; i++){
                    titles.push(res.rows.item(i));
                }
                console.log(titles);
                d.resolve(titles);

            },function(err){
                console.error(err);
            });
            return d.promise;

        }
    };
    database.initDatabase();
    return database;
});

