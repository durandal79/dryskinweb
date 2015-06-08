/**
 * Created by jon on 6/7/15.
 */


var express = require('express');
var when = require('when');
var compress = require('compression');
var request = require('request');


var oneDay = 1;

exports.WebServer = function( engine )
{

    var webapp = express();



    webapp.use(compress());

// Serve up content from public directory
    webapp.use(express.static(__dirname + '/public', { maxAge: oneDay }));


   // webapp.set('view engine', 'ejs');


    var http = require('http').Server(webapp);
    var io = require('socket.io')(http);



    webapp.use(function(req, res, next){
        req.engine = engine;
        next()
    })

    webapp.use(function (req, res, next) {

        console.error('Time:', Date.now());

        io.on("connection", function (socket) {

            //the weatherunderground api has an autoip option that gives us lat long and city name of the ip address.
            // as an alternative I used freegeoip.net/json to get these inputs, and then invoked the openweathermap api, which
            // has more generous api call limits. However, I think weatherunderground is a better product for obtaining
            // data on current conditions.

            req.engine.newRequest(io)

        });
        next();

    });

    webapp.get('/', function(req, res){

        //send the html file for all requests
        res.sendFile(__dirname + 'monitor.html');

    });

    webapp.get("/test", function(req, res)
    {
        console.error("test")
        res.send("test")
    })


    http.listen(3000, function(){

        console.log('listening on *:3000');

    });

}