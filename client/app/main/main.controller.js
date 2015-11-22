'use strict';

angular.module('workspaceApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
      

      // Reload Market Chart
      $http.get('/api/things').success(function(stockList) {
        reloadChart(stockList);
      });
    });

    // Add a stock to a list
    $scope.addThing = function() {

      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });

      // Set form to empty
      $scope.newThing = '';

      // Reload Market Chart
      $http.get('/api/things').success(function(stockList) {
        reloadChart(stockList);
      });
    };

    // Remove a stock to a list
    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);

      // Reload Market Chart
      $http.get('/api/things').success(function(stockList) {
        reloadChart(stockList);
      });
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
}); 

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

        // jQuery.getJSON(

        //  'https://www.quandl.com/api/v3/datasets/WIKI/' +
        //                   'MSFT1' +'.json?api_key=' + apiKey + '&' + 
        //                   'start_date=' + startDate + '&exclude_column_names=true&order=asc', 
        //     function(jsonResult){
        //         console.log("Success! "  + JSON.stringify(jsonResult));
        //     })
        // .done(function() { console.log('getJSON request succeeded!'); })
        // .fail(function(jqXHR, textStatus, errorThrown) { console.log('getJSON request failed! ' + textStatus); })
        //}

    $.each(companyList, function (i, company) {
        $.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' +
                   companyList[i].name +'.json?api_key=' + apiKey + '&' + 
                   'start_date=' + startDate + '&exclude_column_names=true&order=asc' , function (jsonData) {
            
            console.log(companyList[i].name + '  -->-' +jsonData.dataset.data.length);
            // Check if the stock is valid
            if(!jsonData.dataset.data) {
              console.log('Cannot find data for the stock "' + companyList[i].name + '"');
              return;
            }


            // Create an empty data list to be populated with stocks
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
                name: company.name,
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