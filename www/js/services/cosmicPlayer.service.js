angular.module('cosmic.services').factory('cosmicPlayer',  function($interval,$q,$cordovaMedia) {
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

