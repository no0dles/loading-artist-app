angular.module('la.services', [])

  .service('syncService', function ($q, apiService, Persistence) {

    this.syncMetadata = function () {
      var self = this;

      return apiService.getUpdate().then(function (data) {
        var serverStatus = data;

        return Persistence.getUpdateStatus().then(function (updateStatus) {

          if (updateStatus.last_update == null || updateStatus.last_id == null ||
            updateStatus.last_update < serverStatus.last_update || updateStatus.last_id < serverStatus.last_id) {

            return self.saveFetch(updateStatus, 1);
          }

          return [];
        });
      });
    };

    this.saveFetch = function (updateStatus, page) {
      var self = this;

      return apiService.fetch(updateStatus.last_update, updateStatus.last_id, page).then(function (data) {

        for(var i = 0; i < data.comics.length; i++) {
          data.comics[i].comic_id = data.comics[i].id;
          data.comics[i].id = null;

          Persistence.setComic(data.comics[i]);
        }

        if(page < data.total_pages) {
          return self.saveFetch(updateStatus, page+1);
        } else {
          return Persistence.getAllComics();
        }
      });
    };

  })

  .service('apiService', function ($http, serverUrl) {
    this.getUpdate = function () {
      return this.get('/update')
        .then(function (response) {
          return response.data;
        });
    };

    this.fetch = function (lastUpdate, lastId, page) {
      var url = '/fetch?';
      var query = this.qs({
        lastUpdate: lastUpdate,
        lastId: lastId,
        page: page || 1
      });

      return this.get(url + query)
        .then(function (response) {
          return response.data;
        });
    };

    this.encodeURIComponent = function (value) {
      var encoded = encodeURIComponent(value);
      return encoded == 'null' ? '' : encoded;
    };

    this.qs = function(obj, prefix){
      var str = [];
      for (var p in obj) {
        var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push(angular.isObject(v) ? this.qs(v, k) : (k) + "=" + this.encodeURIComponent(v));
      }
      return str.join("&");
    };

    this.get = function (path) {
      return $http.get(serverUrl + path);
    };
  })

  .service('analyticService', function ($cordovaGoogleAnalytics, $window) {
    this.startTrackerWithId = function (id) {
      if(window.cordova && $window.analytics) {
        $cordovaGoogleAnalytics.startTrackerWithId(id);
      }
    };

    this.setUserId = function (id) {
      if(window.cordova && $window.analytics) {
        $cordovaGoogleAnalytics.setUserId(id);
      }
    };

    this.trackView = function (view) {
      if(window.cordova && $window.analytics) {
        $cordovaGoogleAnalytics.trackView(view);
      }
    };

    this.trackEvent = function (category, action, label, value) {
      if(window.cordova && $window.analytics) {
        $cordovaGoogleAnalytics.trackEvent(category, action, label, value);
      }
    };
  })

  .factory('Persistence', function($q) {
    persistence.store.cordovasql.config(persistence, 'comic', '0.0.1', 'Comic Metadata', 5 * 1024 * 1024, 0);

    var entities = {};

    entities.Comic = persistence.define('Comic', {
      comic_id: 'INT',
      title: 'TEXT',
      author: 'TEXT',
      url: 'TEXT',
      img_url: 'TEXT',
      thumb_url: 'TEXT',
      favorite: 'BOOL',
      date: 'DATE',
      last_update: 'DATE'
    });

    persistence.debug = false;
    persistence.schemaSync();

    return {
      Entities: entities,

      setComic: function(comic) {
        persistence.add(new entities.Comic(comic));
        persistence.flush();
      },

      getComicById: function (id) {
        var deferred = $q.defer();

        entities.Comic.all().filter('comic_id', '=', id).one(null, function (comic) {
          deferred.resolve(comic);
        });

        return deferred.promise;
      },

      getPrevComic: function (date) {
        var deferred = $q.defer();

        entities.Comic.all().filter('date', '<', date).order('date', false).one(null, function (comic) {
          deferred.resolve(comic);
        });

        return deferred.promise;
      },

      getNextComic: function (date) {
        var deferred = $q.defer();

        entities.Comic.all().filter('date', '>', date).order('date', true).one(null, function (comic) {
          deferred.resolve(comic);
        });

        return deferred.promise;
      },

      getUpdateStatus: function () {
        var deferred = $q.defer();

        var lastComicId = entities.Comic.all().order('comic_id', false).limit(1);

        lastComicId.one(null, function (comicId) {

          var lastUpdate = entities.Comic.all().order('last_update', false).limit(1);

          lastUpdate.one(null, function (comicUpdate) {
            deferred.resolve({
              last_update: comicUpdate ? comicUpdate.last_update : null,
              last_id: comicId ? comicId.comic_id : null
            });
          });
        });

        return deferred.promise;
      },

      getAllComics: function() {
        var defer = $q.defer();

        entities.Comic.all().order('date', false).list(null, function (comics) {
          defer.resolve(comics);
        });

        return defer.promise;
      }
    };
  });
