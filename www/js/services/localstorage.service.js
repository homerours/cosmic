angular.module('cosmic.services').factory('$localstorage',  function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            var val = $window.localStorage[key];
            if (val === undefined){
                return defaultValue;
            } else {
                return val;
            }
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        },
        getArray: function(key) {
            return JSON.parse($window.localStorage[key] || '[]');
        },
        clear : function(){
            $window.localStorage.clear();
        }
    };
});

