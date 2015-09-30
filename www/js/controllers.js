angular.module('la.controllers', [])

  .controller('SettingsCtrl', function ($scope, $ionicDeploy, $ionicLoading, $cordovaInAppBrowser, analyticService) {
    analyticService.trackView('Settings Screen');

    $scope.doUpdate = function() {
      analyticService.trackEvent('Settings', 'Update', 'Started');

      $ionicLoading.show({
        template: 'Loading...'
      });

      $ionicDeploy.update().then(function(res) {
        analyticService.trackEvent('Settings', 'Update', 'Finished');
        $ionicLoading.hide();
      }, function(err) {
        console.error('Ionic Deploy: Unable to update', err);
        analysticService.trackEvent('Settings', 'Update', 'Error');
        $ionicLoading.hide();
      }, function(prog) {
        $ionicLoading.show({
          template: 'Loading (' + Math.floor(prog) + '%)'
        });
      });
    };

    // Check Ionic Deploy for new code
    $scope.checkForUpdates = function() {
      $ionicDeploy.check().then(function(hasUpdate) {
        $scope.hasUpdate = hasUpdate;
      }, function(err) {
        console.error('Ionic Deploy: Unable to check for updates', err);
      });
    };

    $scope.officialSite = function () {
      analyticService.trackEvent('Settings', 'Official Site');
      $cordovaInAppBrowser.open('http://www.loadingartist.com/', '_system');
    };

    $scope.supportSite = function () {
      analyticService.trackEvent('Settings', 'Support Site');
      $cordovaInAppBrowser.open('https://www.patreon.com/LoadingArtist?ty=h', '_system');
    };

    $scope.checkForUpdates();
  })

  .controller('ComicImageCtrl', function ($scope, $state, $stateParams, $ionicActionSheet, $cordovaSocialSharing, analyticService, Persistence) {
    analyticService.trackView('Comic Screen');

    $scope.comic = {
      comic_id: $stateParams.id
    };
    $scope.nextComic = {};
    $scope.prevComic = {};
    $scope.url = '';
    $scope.loaded = false;

    $scope.imageLoaded = function () {
      $scope.loaded = true;
    };

    $scope.favoriteComic = function () {
      $scope.comic.favorite = !$scope.comic.favorite;
      Persistence.setComic($scope.comic);
    };

    $scope.next = function () {
      $state.transitionTo('comic.image', { id: $scope.nextComic.comic_id });
    };

    $scope.prev = function () {
      $state.transitionTo('comic.image', { id: $scope.prevComic.comic_id });
    };

    $scope.loadComic = function (id) {
      $scope.loaded = false;

      Persistence.getComicById(id).then(function (comic) {
        $scope.comic = comic;

        $scope.url = comic.img_url;

        Persistence.getNextComic(comic.date).then(function (comic) {
          $scope.nextComic = comic;
        });
        Persistence.getPrevComic(comic.date).then(function (comic) {
          $scope.prevComic = comic;
        });
      });
    };

    $scope.showMenu = function () {
      $ionicActionSheet.show({
        buttons: [
          { text: 'Share comic' },
          { text: 'Save comic' }
        ],
        cancelText: 'Cancel',
        buttonClicked: function(index) {
          if(index == 0) {
            analyticService.trackEvent('Comics', 'Share', 'Id', $scope.comic.comic_id);

            $cordovaSocialSharing.share($scope.comic.title, 'Loading Artist', null, $scope.comic.url);

          } else if(index == 1) {
            analyticService.trackEvent('Comics', 'Save', 'Id', $scope.comic.comic_id);

            var img = new Image();
            img.onload = function () {

              var canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;

              var context = canvas.getContext('2d');
              context.drawImage(img, 0, 0);

              window.canvas2ImagePlugin.saveImageDataToLibrary(
                function(){ },
                function(){},
                canvas
              );
            };

            img.src = $scope.comic.img_url;
          }

          return true;
        }
      });

    };

    $scope.loadComic($stateParams.id);
  })

  .controller('ComicGridCtrl', function ($scope, $timeout, $stateParams, analyticService, syncService, Persistence) {
    analyticService.trackView('Comic Grid Screen');

    $scope.id = $stateParams.id;
    $scope.comics = [];
    $scope.syncing = false;

    $scope.sync = function () {
      if($scope.syncing)
        return;

      analyticService.trackEvent('Comics', 'Sync');

      $scope.syncing = true;
      syncService.syncMetadata().then(function (comics) {
        if(comics.length > 0) {
          $scope.comics = comics;
        }

        $timeout(function () {
          $scope.syncing = false;
        }, 1000);
      });
    };

    $scope.reload = function () {
      Persistence.getAllComics().then(function (comics) {
        $scope.comics = comics;
      });
    };

    $scope.reload();
    $scope.sync();
  });
