// See LICENSE file for license information.
(function () {
  var m = angular.module("issueApp", []);
  
  m.filter("markdown", function() {
    return function (input) {
      if (window.markdown) {
        return window.markdown.toHTML(input);
      }
      return input;
    };
  });
    
  m.controller("MainController", ["$scope", "$http", function ($scope, $http) {
  
    var process = function (issueObj) {
      $scope.meta = {
        filter: issueObj.filter,
        repo: issueObj.repo
      };
      $scope.updated = new Date(Date.parse(issueObj.updated)).toLocaleString();
      var issues = issueObj.issues;
      var perMilestone = {};
      var firstMs = null;
      for (var i = 0; i < issues.length; i++) {
        var ms = issues[i].milestone;
        var title = ms != null ? ms.title : "unknown";
        if (firstMs === null) firstMs = title;
        var msList = perMilestone[title];
        if (typeof msList === "undefined") {
          msList = perMilestone[title] = [];
        }
        msList.push(issues[i]);
      };
      $scope.perMilestone = perMilestone;
      $scope.currentMs = firstMs;
    };
    
    $scope.$watch("currentMs", function (newValue) {
      if (!newValue) return;
      $scope.currentIssues = $scope.perMilestone[newValue];
    });

    var fn = "issues.js"; // js rather than js to keep IIS happy during my testing...
    $http({ method: "GET", url: fn }).then(function (response) {
      process(response.data);
    }, function () {
      $scope.error = "Failed to load " + fn + ". Check the console for errors.";
    });
  }]);

})();