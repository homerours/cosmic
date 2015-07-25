angular.module('cosmic.controllers', []);
angular.module('cosmic.directives', []);
angular.module('cosmic.services', []);

angular.module('cosmic', ['ionic', 'ngCordova', 'cosmic.controllers', 'cosmic.services','cosmic.directives'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleLightContent();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  .state('tab.playlists', {
    url: '/playlists',
    views: {
      'tab-playlists': {
        templateUrl: 'templates/playlists.html',
        controller: 'PlaylistsCtrl'
      }
    }
  })

  .state('tab.artists', {
      url: '/artists',
      views: {
        'tab-artists': {
          templateUrl: 'templates/artists.html',
          controller: 'ArtistsCtrl'
        }
      }
    })

    .state('tab.titles', {
      url: '/artists/:artistId',
      views: {
        'tab-artists': {
          templateUrl: 'templates/titles.html',
          controller: 'TitlesCtrl'
        }
      }
    })

    .state('tab.settings', {
      url: '/settings',
      views: {
        'tab-settings': {
          templateUrl: 'templates/settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })

  .state('tab.player', {
    url: '/player',
    views: {
      'tab-player': {
        templateUrl: 'templates/player.html',
        controller: 'PlayerCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/playlists');

})
.config(['$ionicConfigProvider', function($ionicConfigProvider) {
    //if(!ionic.Platform.isIOS())$ionicConfigProvider.scrolling.jsScrolling(false); // native scrolling
    $ionicConfigProvider.tabs.position('bottom'); // other values: top
    $ionicConfigProvider.tabs.style('standard'); // other values: top
    $ionicConfigProvider.views.transition('ios'); // other values: top

}]);
