// Reformat artist, album or title strings
angular.module('cosmic.services').factory("stringProcessing", function() {

    return {
        fixSpaces : function(str){
            // Remove double spaces
            return str.replace(/\s\s+/g, ' ').replace(/^ /,'').replace(/ $/,'');
        },
        removeWebUrl : function(str){
            return str.replace(/(https?\:\/\/)?www\.([a-z0-9\-àéèùêîôâ]+\.)+[a-z]{2,4}/gi,'');
        },
        removeSpecials : function(str){
            return str.replace(/[\|\%\\]/g,'');
        },
        upperCaseFirstLetter : function(str){
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        formatString : function(str){
            var ans = this.removeWebUrl(str);
            ans = this.removeSpecials(ans);
            ans = this.fixSpaces(ans);
            ans = this.upperCaseFirstLetter(ans);
            return ans;
        },

        formatTitle : function(title){
            title.title = this.formatString(title.title);
            title.artist = this.formatString(title.artist);
            title.album = this.formatString(title.album);
        },

        formatAllTitles : function(titleList){
            for( var i = 0;  i < titleList.length; i++){
                this.formatTitle(titleList[i]);
            }
        }

    };
});
