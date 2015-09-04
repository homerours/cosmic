 www/js/services/cosmicDB.service.js | 26 [32m++++++++++++[m[31m--------------[m
 1 file changed, 12 insertions(+), 14 deletions(-)

[1;33mdiff --git a/www/js/services/cosmicDB.service.js b/www/js/services/cosmicDB.service.js[m
[1;33mindex c05380f..ee17276 100644[m
[1;33m--- a/www/js/services/cosmicDB.service.js[m
[1;33m+++ b/www/js/services/cosmicDB.service.js[m
[1;35m@@ -20,9 +20,9 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
                 return $cordovaSQLite.execute(self.db, "INSERT OR REPLACE INTO artwork (id,file_name) VALUES (1,?)",['default_artwork.jpg']).then(function(){[m
                     $cordovaSQLite.execute(self.db, "SELECT * from artwork",[]).then(function(res){[m
                         console.log('got all artworks');[m
[31m-                        var artworks=[];[m
[32m+[m[32m                        var artworks=new Array(res.rows.length);[m
                         for (var i=0; i < res.rows.length; ++i){[m
[31m-                            artworks.push(res.rows.item(i));[m
[32m+[m[32m                            artworks[i]=res.rows.item(i);[m
                         }[m
                     });[m
 [m
[1;35m@@ -85,9 +85,9 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
                 " ON artist.id = alb.artist"+[m
                 " INNER JOIN artwork ON alb.artwork = artwork.id GROUP BY alb.artist ORDER BY artist.name COLLATE NOCASE";[m
             return $cordovaSQLite.execute(this.db,query, []).then(function(res) {[m
[31m-                var artists=[];[m
[32m+[m[32m                var artists=new Array(res.rows.length);[m
                 for (var i=0; i < res.rows.length; ++i){[m
[31m-                    artists.push(res.rows.item(i));[m
[32m+[m[32m                    artists[i]=res.rows.item(i);[m
                 }[m
                 return artists;[m
             });[m
[1;35m@@ -104,9 +104,8 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
                 " artwork ON album.artwork = artwork.id ORDER BY album.name,title.track";[m
 [m
             return $cordovaSQLite.execute(this.db,query, [artistId]).then(function(res) {[m
[31m-                console.log('Got '+res.rows.length+' titles');[m
                 var albums=[]; // For the scope[m
[31m-                var viewPlaylist=[]; // For the player service[m
[32m+[m[32m                var viewPlaylist=new Array(res.rows.length); // For the player service[m
                 var i = 0;[m
                 while (i<res.rows.length){[m
                     var currentAlbumId=res.rows.item(i).albumId;[m
[1;35m@@ -114,7 +113,7 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
                     var titles= [];[m
                     while (i<res.rows.length && res.rows.item(i).albumId==currentAlbumId){[m
                         var item = res.rows.item(i);[m
[31m-                        viewPlaylist.push(item);[m
[32m+[m[32m                        viewPlaylist[i]=item;[m
                         item.index = i;// Index is the position of the song in the playlist[m
                         titles.push(item);[m
                         i++;[m
[1;35m@@ -122,7 +121,6 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
                     currentAlbum.titles=titles;[m
                     albums.push(currentAlbum);[m
                 }[m
[31m-                console.log('Got titles');[m
                 return {albums : albums, playlist : viewPlaylist};[m
             },function(err){[m
                 console.log('error');[m
[1;35m@@ -526,9 +524,9 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
             var d = $q.defer();[m
             var query = self.playlistQueries[nbPlaylist];[m
             $cordovaSQLite.execute(self.db,query.query,[nbTitles]).then(function(res){[m
[31m-                var playlist=[];[m
[32m+[m[32m                var playlist=new Array(res.rows.length);[m
                 for (var j=0; j<res.rows.length; j++){[m
[31m-                    playlist.push(res.rows.item(j));[m
[32m+[m[32m                    playlist[j]=res.rows.item(j);[m
                 }[m
                 d.resolve({name : query.name, titles : playlist});[m
             },function(err){[m
[1;35m@@ -631,9 +629,9 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
                 " artwork ON album.artwork = artwork.id"+[m
                 " ORDER BY items.position";[m
             $cordovaSQLite.execute(self.db,query, [playlistId]).then(function(res){[m
[31m-                var playlist=[];[m
[32m+[m[32m                var playlist=new Array(res.rows.length);[m
                 for (var i=0; i<res.rows.length; i++){[m
[31m-                    playlist.push(res.rows.item(i));[m
[32m+[m[32m                    playlist[i]=res.rows.item(i);[m
                 }[m
                 d.resolve(playlist);[m
             },function(err){[m
[1;35m@@ -692,9 +690,9 @@[m [mangular.module('cosmic.services').factory('cosmicDB',  function($q,$cordovaSQLit[m
             }[m
             query += ' ORDER BY title.nb_played DESC LIMIT 20';[m
             $cordovaSQLite.execute(self.db,query, words).then(function(res){[m
[31m-                var titles=[];[m
[32m+[m[32m                var titles=new Array(res.rows.length);[m
                 for (var i=0; i< res.rows.length; i++){[m
[31m-                    titles.push(res.rows.item(i));[m
[32m+[m[32m                    titles[i]=res.rows.item(i);[m
                 }[m
                 d.resolve(titles);[m
 [m
