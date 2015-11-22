'use strict';

var testList = [];

angular.module('workspaceApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      testList = awesomeThings;

      socket.syncUpdates('thing', $scope.awesomeThings);

      reloadChart(testList);
    });

    // Add a stock to a list
    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';

      testList.push({ name: $scope.newThing });
      
      // ADD OBJECT REPSONSE with newsly added object
      reloadChart(testList);
    };

    // Remove a stock to a list
    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
      reloadChart($scope.awesomeThings);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
  });


  /**
  * Reload chart
  */

            // Initialize chart data
  function reloadChart(companyList) {
    console.log("Reloading -> " + JSON.stringify(companyList));

    for(var company in companyList)
      console.log(companyList[company].name);

      var seriesOptions = [],
          seriesCounter = 0,
          startDate = '2015-01-01',
          apiKey = 'mytMZB31ArgfkNYgsNyn';
      $.each(companyList, function (i, company) {
          $.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' +
                     companyList[i].name +'.json?api_key=' + apiKey + '&' + 
                     'start_date=' + startDate + '&exclude_column_names=true&order=asc' , function (jsonData) {
            
              var dataList = [ ];
              
              // Process jso in the following list form [[date,price],...]
              for(var row in jsonData.dataset.data) {
                var tempList = [ ];
                tempList.push(new Date(jsonData.dataset.data[row][0]).getTime());
                tempList.push(jsonData.dataset.data[row][11]);
                dataList.push(tempList);
              }

              // Add a name and data list to each of the stocks
              seriesOptions[i] = {
                  name: company,
                  data: dataList
              };

              // Keep a counter and create the chart when all the data is loaded.
              seriesCounter += 1;

              if (seriesCounter === companyList.length) {
                  createChart(seriesOptions);
              }
          });
      });
  }

  /**
   * Create the chart when all data is loaded
   */
  function createChart(seriesOptions) {

      $('#chart').highcharts('StockChart', {

          rangeSelector: {
              selected: false
          },

          yAxis: {
              labels: {
                  formatter: function () {
                      return (this.value > 0 ? ' + ' : '') + this.value + '%';
                  }
              },
              plotLines: [{
                  value: 0,
                  width: 2,
                  color: 'silver'
              }]
          },

          plotOptions: {
              series: {
                  compare: 'percent'
              }
          },

          tooltip: {
              pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
              valueDecimals: 2
          },

          series: seriesOptions
      });
  }