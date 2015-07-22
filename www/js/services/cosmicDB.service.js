angular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLite, cosmicPlayer,$cordovaFile,cosmicConfig,imageService) {
    var database={
        db: null,
        initDatabase: function(){
            console.log("INIT DATABASE");
            this.db = $cordovaSQLite.openDB("cosmic");
        },

        flushDatabase: function(){
            // clear Database
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS artist");
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS album");
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS title");
            $cordovaSQLite.execute(this.db, "DROP TABLE IF EXISTS artwork");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artist (id integer primary key autoincrement, name text)");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS album (id integer primary key autoincrement, name text, artist integer, artwork integer default 1)");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS title (id integer primary key autoincrement, name text, album integer, track integer, year integer,path text)");
            var self=this;
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS artwork (id integer primary key autoincrement, file_name text)").then(function(){
                $cordovaSQLite.execute(self.db, "INSERT INTO artwork (file_name) VALUES (?)",['default_artwork.jpg']);
            });



        },
        removeAllArtworks : function(){
            var d=$q.defer();
            $cordovaSQLite.execute(this.db, "SELECT file_name FROM artwork WHERE id>1",[]).then(function(res){
                var promises=[];
                var artworkDir = cosmicConfig.appRootStorage + 'artworks/';
                for (var i=0; i < res.rows.length; ++i){
                    promises.push($cordovaFile.removeFile(artworkDir,res.rows.item(i).file_name));
                }
                $q.all(promises).then(function(res){
                    d.resolve();
                });
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
                var artworkPath=cosmicConfig.appRootStorage + 'miniatures/';
                for (var i=0; i < res.rows.length; ++i){
                    artists.push({name : res.rows.item(i).name, id :res.rows.item(i).id, artwork : artworkPath+res.rows.item(i).artwork, nbAlbums : res.rows.item(i).nbAlbums, nbTitles : res.rows.item(i).nbTitles});
                }
                return artists;
            });
        },

        getTitles:  function(artistId){
            // Get all titles from artist
            var query= "SELECT t.name AS titleName, t.id AS titleId,t.track, t.path AS path, art.file_name AS artworkFileName, albumName , albumId , artistName FROM"+
                " title t INNER JOIN"+
                " (SELECT ar.name AS artistName, al.name AS albumName, al.id AS albumId, al.artwork FROM"+
                " (SELECT * FROM artist WHERE id=?) ar INNER JOIN album al ON al.artist=ar.id) a"+
                " ON t.album=a.albumId INNER JOIN artwork art ON a.artwork = art.id ORDER BY albumName,t.track";
            return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {
                console.log('Got '+res.rows.length+' titles');
                console.dir(res.rows.item(0));
                var albums=[]; // For the scope
                var viewPlaylist=[]; // For the player service
                var i = 0;
                var artworkPath=cosmicConfig.appRootStorage + 'artworks/';
                while (i<res.rows.length){
                    var currentAlbumId=res.rows.item(i).albumId;
                    var currentAlbum={name: res.rows.item(i).albumName, id : res.rows.item(i).albumId, artwork : artworkPath+res.rows.item(i).artworkFileName};
                    var titles= [];
                    while (i<res.rows.length && res.rows.item(i).albumId==currentAlbumId){
                        titles.push({name:res.rows.item(i).titleName, id: res.rows.item(i).titleId, index : i, artwork: res.rows.item(i).artworkFileName});
                        // Index is the position of the song in the playlist
                        viewPlaylist.push({name:res.rows.item(i).titleName, album: res.rows.item(i).albumName,artist : res.rows.item(i).artistName, path : res.rows.item(i).path ,id: res.rows.item(i).titleId, artwork : artworkPath+res.rows.item(i).artworkFileName});
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
                        dbService.addArtwork(albumCover).then(function(artworkId){
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
                        dbService.addArtwork(albumCover).then(function(artworkId){
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

        addArtwork: function(fileName){
            var self=this;
            var defered=$q.defer();
            if (fileName){
                $cordovaSQLite.execute(self.db,"INSERT INTO artwork (file_name) VALUES (?)", [fileName]).then(function(res) {
                    console.log("INSERT ARTWORK ID -> " + res.insertId);
                    var dataPath = cosmicConfig.appRootStorage;
                    $cordovaFile.moveFile(dataPath+'tmp/',fileName,dataPath + 'artworks/',fileName).then(function(){
                        imageService.makeMiniature(fileName).then(function(){
                            defered.resolve(res.insertId);
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
        }
    };
    database.initDatabase();
    return database;
});

