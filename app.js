var express = require('express');
var app = express();

// The number of milliseconds in one day
//set to 86400000 ms for normal operations

var oneDay = 1000;

// Use compress middleware to gzip content

var compress = require('compression');
app.use(compress());

// Serve up content from public directory
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));


app.set('view engine', 'ejs');


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

app.use('/',function (req, res, next) {

    console.log('Time:', Date.now());

    io.on("connection", function (socket) {

        //the weatherunderground api has an autoip option that gives us lat long and city name of the ip address.
        // as an alternative I used freegeoip.net/json to get these inputs, and then invoked the openweathermap api, which
        // has more generous api call limits. However, I think weatherunderground is a better product for obtaining
        // data on current conditions.

        request('http://api.wunderground.com/api/9d0056d1d372fb05/conditions/q/autoip.json', function (error, response, body) {
            if (!error && response.statusCode == 200) {

           //Note, in cases where we exceed our free level api calls, we could divert to another function that uses freegeoip.net/json to
                //get lat long and then use those as inputs to openweathermap, which we use below


                var conditions = JSON.parse(body); // parse weather data

                var geodat ={city: conditions.current_observation.display_location.full};

                io.emit("geoout", geodat);

                var lat = conditions.current_observation.observation_location.latitude;
                var long = conditions.current_observation.observation_location.longitude;

                var UV = conditions.current_observation.UV; // UV index
                console.log(UV);

                var To = conditions.current_observation.temp_c; // outdoor air temperature, deg C
                var RHout = conditions.current_observation.relative_humidity; // relative humidity of outdoor air, %
                console.log(RHout);

                var Td = conditions.current_observation.dewpoint_c; // dewpoint of outdoor air, degC

                var RHo = 100*(Math.exp((17.625*Td)/(243.04+Td))/Math.exp((17.625*To)/(243.04+To))); //calculate RH from dewpoint, Td degC

                console.log(RHo);

                var S = 250; // emission rate of water vapor into indoor air from various sources, gm/hour
                var A = 158; // floor area of house, m^2
                var Hc = 2.8; // average ceiling height, m
                var V = A * Hc; // house volume, m^3
                var AER = 0.3; // air exchange rate, exchanges/hr
                var Alpha = 0.65; // rate of water vapor uptake into building materials, fraction/hr
                var Beta = 0.2; // rate of water vapor release from building materials, fraction/hr
                var Tin = 26; // indoor temperature, deg C
                var Wsat = (100000 * (6.112 * Math.exp(17.62 * Tin / (243.12 + Tin))) / ((273.15 + Tin) * 461.5)); // saturated water vapor concentration at indoor temperature, gm/m^3

                console.log(Wsat);

                var Wout = 216.7*(RHo/100)*6.112*Math.exp(17.62 * To / (243.12 + To))/(243.12+To); //Calculates absolute humidity of outdoor air, gm/m^3

                console.log(Wout);

                var Win = (S / V + AER * Wout + Beta * Wsat) / (AER + Alpha); // calculates water vapor concentration in indoor air, gm/m^3
                console.log(Win);
                var RHin = (Win / Wsat) * 100; // relative humidity of indoor air, %


                console.log(RHin);

                var type = 0;
                if (RHin <= 30) {
                    type = 4;
                }
                else if (RHin <= 40) {
                    type = 3;
                }
                else if (RHin <= 50) {
                    type = 2;
                }
                else if (RHin <= 60) {
                    type = 1;
                }

                console.log(type);

                io.emit("number", type);

                request('http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + long + '&units=metric&APPID=e450050cc136b1b2d3598501a1489045', function (error, response, body) {
                    if (!error && response.statusCode == 200) {

                        var weather = JSON.parse(body); // parse weather data
                        var tempout = weather.list[40].main.temp;
                        var H = weather.list[40].main.humidity;
                        var date = weather.list[40].dt_txt;
                        var icount = weather.cnt;
                        console.log(tempout);
                        console.log(H);
                        console.log(date);
                        console.log(icount);

                        for(var i = 0; i < icount; i++) {
                            var obj = weather.list[i].main.temp;

                            console.log(obj);
                        }
                    }

                });
            }
        });
            });
            next();

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
