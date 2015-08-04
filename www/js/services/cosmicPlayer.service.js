// Service for playing audio files
angular.module('cosmic.services').factory('cosmicPlayer',  function($interval,$q,$cordovaMedia,cosmicDB, $localstorage) {
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    var player = {
        playing        : false,
        shuffle        : false,
        loop           : true,
        onUpdate       : function(position){}, // callback on position update while playing
        onTitleChange  : function(){}, // callback on title change
        isWatchingTime : null,
        duration       : 0,
        media          : null,
        playlist       : [{artist : '',name : 'No Media', artwork : 'default_artwork.jpg'}],
        playlistIndex  : 0,

        loadSettings : function(){
            this.shuffle        = ($localstorage.get('shuffle','false') === 'true');
            this.loop           = ($localstorage.get('loop','true') === 'true');
        },
        setIndex : function(title){
            this.playlistIndex=this.playlist.indexOf(title);
        },
        toogleShuffle : function(){
            this.shuffle = ! this.shuffle;
            $localstorage.set('shuffle',this.shuffle);
        },
        toogleLoop : function(){
            this.loop = ! this.loop;
            $localstorage.set('loop',this.loop);
        },

        // Load a playlist in the player
        loadPlaylist: function(playlist) {
            var playlistCopy = playlist.slice();
            if (this.shuffle){
                playlistCopy = shuffle(playlistCopy);
            }
            console.log('Load playlist, size: '+playlist.length);
            player.playlist = playlistCopy;
        },

        // add an item of current view as next
        setNext: function(title){
            this.playlist.splice(this.playlistIndex+1,0,title);
        },

        // Play playlist item at 'playlistindex' position
        initMedia: function() {
            var self=this;
            self.clearMedia();
            console.log('init media');
            var mypath=this.playlist[self.playlistIndex].path;
            self.media=new Media(mypath);
            self.play();
            self.onTitleChange();
        },

        // Release media
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
        launchPlayer: function(title) {
            var self=this;
            self.setIndex(title);
            self.initMedia();
        },
        play: function() {
            player.playing = true;
            this.startWatchTime();
            this.media.play();
        },
        pause: function() {
            player.playing = false;
            this.media.pause();
            this.stopWatchTime();
        },
        stop: function() {
            this.media.stop();
            this.stopWatchTime();
            player.playing = false;
        },

        // seek to percent
        seek: function(percent) {
            var self=this;
            console.log(percent);
            console.log('Duration: '+self.duration);
            if (self.duration >0){
                var newPosition=percent*self.duration;
                self.media.seekTo(newPosition);
                console.log('seek to '+newPosition);
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
                    self.play();
                }
            });
        },
        next: function() {
            var self=this;
            self.playlistIndex = (self.playlistIndex + 1) % self.playlist.length;
            self.initMedia(self.playlistIndex);
            if (self.playlistIndex === 0 && ! self.loop){
                self.pause();
            }
        },

        // Watch position every 500ms
        startWatchTime: function() {
            var self=this;
            if (self.media){
                var dur;
                var counter=0;
                self.isWatchingTime=$interval(function(){
                    self.media.getCurrentPosition(function(pos){
                        self.onUpdate(1000*pos);
                        if (self.duration>0 && (1000*pos>=self.duration-600 || pos < 0)){
                            // update Play statistics
                            cosmicDB.updateTitlePlayStatistics(self.playlist[self.playlistIndex].id);
                            console.log('End of current song --- play next song');
                            self.next();
                        }
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

        // get duration of current media
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
                defered.resolve(-1000);
            }
            return defered.promise;
        }
    };
    player.loadSettings();
    return player;
});

