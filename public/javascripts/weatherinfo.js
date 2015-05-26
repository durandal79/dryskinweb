
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

app.get('./public/monitor.html', function(req, res){

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
                    console.log(To);
                    console.log(RHo);
                    console.log(V);
                    console.log(Wsat);
                    console.log(Wo);
                    console.log(Win);
                    console.log(RHin);
                    io.emit("number", RHin);

                }
            });
        });
    });








