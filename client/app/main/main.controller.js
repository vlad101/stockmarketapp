'use strict';

angular.module('workspaceApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
      
      // Reload Market Chart
      $scope.refreshChart();
    });

    // Add a stock to a list
    $scope.addThing = function() {

      // Initialize error message
      $scope.invalidStock = '';

      // Check the input stock is valid
      if($scope.newThing === '') {
        $scope.invalidStock = "Stock is invalid, try again!";
        return;
      }

      // Validate stock before adding to the chart
      $scope.addStock();
    };

    // Validate stock before adding to the chart
    $scope.addStock = function() {
      jQuery.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' +
                        $scope.newThing +'.json?api_key=mytMZB31ArgfkNYgsNyn&' + 
                        'start_date=' + getDate() + '&exclude_column_names=true', 
            function(jsonData){

                for(var company in $scope.awesomeThings) {
                  if($scope.awesomeThings[company].name == $scope.newThing) {
                    $scope.$apply(function() {
                      $scope.invalidStock = "Stock is already added, try again!";
                    });
                    return;
                  }
                }

                // Insert a new stock to DB
                $http.post('/api/things', { name: $scope.newThing });

                // Set form to empty
                $scope.newThing = '';

                // Reload Market Chart
                $scope.refreshChart();
          })
      .fail(function(jqXHR, textStatus, errorThrown) {
        $scope.$apply(function() {
          $scope.invalidStock = "Stock is invalid, try again!";
        });
      });
    }

    // Remove a stock to a list
    $scope.deleteThing = function(thing) {

      // Delete a new stock from DB
      //$http.delete('/api/things/' + thing._id);
    $http.delete("/api/things/" + thing._id)
      .success(function() {
        $scope.refreshChart();
      }).error(function(error) {
      }).then(function() {
      });
      // Reload Market Chart
      //$scope.refreshChart();
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });

    // Get company data and refresh chart
    $scope.refreshChart = function() {
      $http.get('/api/things').success(function(stockList) {
          $scope.chartDataEmpty = false;
          if(stockList.length == 0)
            $scope.chartDataEmpty = true;
          reloadChart(stockList);
      });
    }
});

/**
* Get today's date
*/
function getDate() {
  var date = new Date();
  var yyyy = date.getFullYear().toString();                                    
  var mm = (date.getMonth()+1).toString();       
  var dd  = date.getDate().toString();             
  return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
}

/**
* Reload chart
*/
function reloadChart(companyList) {

    // Initialize chart data
    var seriesOptions = [],
      seriesCounter = 0,
      startDate = '2015-01-01',
      apiKey = 'mytMZB31ArgfkNYgsNyn';


        //CHECK THIS OUT ERROR HANDLING!
    $.each(companyList, function (i, company) {
        jQuery.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' +
                          companyList[i].name +'.json?api_key=' + apiKey + '&' + 
                          'start_date=' + startDate + '&exclude_column_names=true&order=asc', 
                function(jsonData){
                  var dataList = processJsonData(jsonData);

                  // Add a name and data list to each of the stocks
                  seriesOptions[i] = {
                      name: company.name,
                      data: dataList
                  };

                  // Keep a counter and create the chart when all the data is loaded.
                  seriesCounter += 1;

                  if (seriesCounter === companyList.length) {
                      createChart(seriesOptions);
                  }
            })
        .fail(function(jqXHR, textStatus, errorThrown) { 
          console.log('Something went wrong, try again!');
        });
    });
}

/**
 * Process chart data.
 */
function processJsonData(jsonData)  {

  // Create an empty data list to be populated with stocks
  var dataList = [ ];
  
  // Process jso in the following list form [[date,price],...]
  for(var row in jsonData.dataset.data) {
    var tempList = [ ];
    tempList.push(new Date(jsonData.dataset.data[row][0]).getTime());
    tempList.push(jsonData.dataset.data[row][11]);
    dataList.push(tempList);
  }

  return dataList;
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