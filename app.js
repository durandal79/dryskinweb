var express = require('express');
var app = express();

// The number of milliseconds in one day
//set to 86400000 ms for normal operations

var oneDay = 0;

// Use compress middleware to gzip content

var compress = require('compression');
app.use(compress());

// Serve up content from public directory
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

//app.listen(process.env.PORT || 3000);

//var weatherinfo = require('./public/javascripts/weatherinfo.js');

app.set('view engine', 'ejs');


//var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

app.get('/', function(req, res){

    //send the html file for all requests
    res.sendFile(__dirname + 'monitor.html');

});

http.listen(3000, function(){

    console.log('listening on *:3000');

});

console.log('weather test');


io.on("connection", function(socket) {

    socket.on("latlong", function (latlong) {
        // input from the browser

        console.log(latlong.lat);
        var lat = latlong.lat;

        console.log(latlong.long);
        var long = latlong.long;

        request('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + long + '&units=metric&APPID=e450050cc136b1b2d3598501a1489045', function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var weather = JSON.parse(body); // parse weather data
                var To = weather.main.temp; // outdoor air temperature, deg C
                var RHo = weather.main.humidity; // relative humidity of outdoor air, %

                var S = 200; // emission rate of water vapor into indoor air from various sources, gm/hour
                var A = 158; // floor area of house, m^2
                var Hc = 2.8; // average ceiling height, m
                var V = A * Hc; // house volume, m^3
                var AER = 0.25; // air exchange rate, exchanges/hr
                var Alpha = 0.65; // rate of water vapor uptake into building materials, fraction/hr
                var Beta = 0.17; // rate of water vapor release from building materials, fraction/hr
                var Tin = 20; // indoor temperature, deg C
                var Wsat = (100000 * (6.112 * Math.exp(17.62 * Tin / (243.12 + Tin))) / ((273.15 + Tin) * 461.5)); // saturated water vapor concentration at indoor temperature, gm/m^3
                var Wo = 216.7 * (RHo / 100) * (6.112 * Math.exp((17.62 * To) / (243.12 + To))) / (273.15 + To); //Calculates absolute humidity of outdoor air, gm/m^3
                var Win = (S / V + AER * Wo + Beta * Wsat) / (AER + Alpha); // calculates water vapor concentration in indoor air, gm/m^3
                var RHin = (Win / Wsat) * 100; // relative humidity of indoor air, %

                var type = 0;
                if(RHin <= 30)
                {
                    type =4;
                }
                else if(RHin <= 40)
                {
                    type = 3;
                }
                else if(RHin <= 50)
                {
                    type = 2;
                }
                else if(RHin <=60)
                {
                    type = 1;
                }
                else if(RHin > 60)
                {
                    type = 0;
                };



                console.log(RHin);
                io.emit("number", type);

            }
        });
    });
});








// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
