/**
 * Created by jon on 6/7/15.
 */


var eng = require("./engine.js")
var server = require("./server.js")

function Application()
{
    var self = this;


    var engine = new eng.Engine()

    var web = new server.WebServer(engine)

}

GLOBAL.app = new Application();