angular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLite, cosmicPlayer) {
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
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS album (id integer primary key autoincrement, name text, artist integer, artwork integer default 1)");
            $cordovaSQLite.execute(this.db, "CREATE TABLE IF NOT EXISTS title (id integer primary key autoincrement, name text, album integer, track integer, year integer,path text)");
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
                " title t INNER JOIN"+
                " (SELECT ar.name AS artistName, al.name AS albumName, al.id AS albumId, al.artwork FROM"+
                " (SELECT * FROM artist WHERE id=?) ar INNER JOIN album al ON al.artist=ar.id) a"+
                " ON t.album=a.albumId INNER JOIN artwork art ON a.artwork = art.id ORDER BY albumName,t.track";
            return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {
                console.log('Got '+res.rows.length+' titles');
                console.dir(res.rows.item(0));
                var albums=[];
                var viewPlaylist=[];
                var i = 0;
                var path=cordova.file.externalRootDirectory+'Music/Mymusic/';
                while (i<res.rows.length){
                    var currentAlbumId=res.rows.item(i).albumId;
                    var currentAlbum={name: res.rows.item(i).albumName, id : res.rows.item(i).albumId, artwork : path+res.rows.item(i).artworkFileName};
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

