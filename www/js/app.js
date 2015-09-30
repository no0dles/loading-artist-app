angular.module('la', ['ionic','ionic.service.core','ionic.service.deploy', 'ngCordova', 'la.controllers', 'la.services', 'la.directives', 'la.filters'])

  .run(function($ionicPlatform, $ionicUser, $cordovaDevice, $cordovaStatusbar, analyticService) {
    $ionicPlatform.ready(function() {

      analyticService.startTrackerWithId('UA-50451413-4');

      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        analyticService.setUserId($cordovaDevice.getUUID());
      }

      if(typeof StatusBar !== 'undefined') {
        $cordovaStatusbar.style(1);
      }
    });
  })

  .constant('serverUrl', 'https://loadingartist.evilservices.com')

  .config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider) {

    $ionicConfigProvider.views.transition('none');

    $stateProvider

      .state('comic', {
        url: '/comic',
        abstract: true,
        templateUrl: 'templates/comic.html'
      })

      .state('comic.grid', {
        url: '/grid/:id',
        views: {
          'content': {
            templateUrl: 'templates/comic-grid.html',
            controller: 'ComicGridCtrl'
          }
        }
      })

      .state('comic.image', {
        url: '/image/:id',
        views: {
          'content': {
            templateUrl: 'templates/comic-image.html',
            controller: 'ComicImageCtrl'
          }
        }
      })

      .state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsCtrl'
      });

    $urlRouterProvider.otherwise('/comic/grid/');

  });
