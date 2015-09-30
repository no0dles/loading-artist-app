angular.module('la.directives', [])
  .directive('grid', function () {
    return {
      scope: {
        comics: '=',
        maxSize: '=',
        minColumns: '=',
        padding: '='
      },
      restrict: 'AE',
      replace: 'true',
      templateUrl: 'templates/directives/grid.html',
      link: function (scope, elm) {
        var width = elm[0].offsetWidth;

        var columns = scope.minColumns;
        scope.itemWidth = Math.floor(width / columns);
        if(scope.itemWidth > scope.maxSize) {
          columns = Math.ceil(width / (scope.maxSize));
          scope.itemWidth = Math.floor(width / columns);
        }

        scope.itemStyle = function () {
          return {
            'width': scope.itemWidth + 'px',
            'height': scope.itemWidth + 'px'
          }
        };

        scope.imageLoaded = function (comic) {
          comic.loaded = true;
        };
      }
    }
  })

  .directive('imageOnload', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('load', function() {
          //call the function that was passed
          scope.$apply(attrs.imageOnload);
        });
      }
    };
  })

  .directive('appVersion', function ($ionicDeploy) {
    return function(scope, elm) {
      $ionicDeploy.info().then(function(deployInfo) {

        var text = deployInfo['binary_version'];

        if(deployInfo['deploy_uuid']) {
          text +=  " (" + deployInfo['deploy_uuid'].substring(0, 5) + ")";
        }

        elm.text(text);

      }, function () {
        elm.text('-');
      });
    };
  });
