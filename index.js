var express = require('express'),
    app = express(),
    httpo = require('http'),
    http = httpo.Server(app),
    io = require('socket.io').listen(http),
    bodyParser = require("body-parser"),
    request = require("request");

app.use(express.static(__dirname + '/static'));
app.use(bodyParser.json());

require('http').globalAgent.maxSockets = Infinity;

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html");
});


app.get('/test', function(req, res) {
    io.emit('add_drop', "test");
    res.send('Get test');
});


//Controls for auto airdrop system

var auto_airdrop_status = false;

function set_auto_drop_status(status) {
    if(auto_airdrop_status !== status) {
        auto_airdrop_status = status;
        if(status === "true" && airdrop_status !== "waiting for optimal time")
        {
            set_drop_status("waiting for optimal time");
            autoDrop = setInterval(function(){ drop_if_in_range() }, 50);
        }
        io.emit("auto_airdrop_status", auto_airdrop_status);
    }

}

//Returns whether system is set to automatically drop when optimal
app.get('/auto_airdrop_status', function(req, res) {
    var data = {"auto_airdrop_status": auto_airdrop_status};
    res.send(JSON.stringify(data));
});

app.post('/auto_airdrop_on', function(req, res) {
    set_auto_drop_status("true");
    io.emit("auto_airdrop_status", "true");
    res.send('Auto airdrop turned on');

});

app.post('/auto_airdrop_off', function(req, res) {
    set_auto_drop_status("false");
    io.emit("auto_airdrop_status", "false");
    clearInterval(autoDrop);
    res.send('Auto airdrop turned off');

});

function within_range(raw_data) {
    var plane_data = JSON.parse(raw_data);

    var x0 = parseFloat(plane_data["plane_location"]["x"]);
    var y0 = parseFloat(plane_data["plane_location"]["y"]);
    var vx = parseFloat(plane_data["plane_velocity"]["vx"]);
    var vy = parseFloat(plane_data["plane_velocity"]["vy"]);

    x1 = x0 + vx * .5;
    y1 = y0 + vy * .5;

    var distance = Math.sqrt(Math.pow((x1-135),2) + Math.pow((y1-100),2));

    return distance < 5 && vy*(y1-100) > 0 && vx*(x1-135) > 0;
}

function drop_if_in_range() {
    request.get(
        'http://128.253.51.87/plane/state',
        function (error, response, plane_data) {
            if (!error && response.statusCode === 200) {
                if(within_range(plane_data) && airdrop_status !== "dropped") {
                    request.post(
                        'http://128.253.51.87/plane/release_bottle',
                        function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                set_drop_status("dropped");
                                console.log("range drop");
                                io.emit("add_drop", body);
                            }
                        }
                    );
                }
            }
        }
    );
}

var autoDrop;





/* Controls for airdrop state
 * Options: 'carrying' | 'waiting for optimal time'  | 'dropped'
 */

var airdrop_status = "carrying";

function set_drop_status(status) {
    if(airdrop_status !== status) {
        airdrop_status = status;
        io.emit("airdrop_status", status);
        if(status === "dropped") {
            clearInterval(autoDrop);
        }
    }
}

//Returns the current state of the dropping mechanism
app.get('/airdrop_status', function(req, res) {
    var data = {"airdrop_status": airdrop_status};
    res.send(JSON.stringify(data));
});

app.post('/airdrop_status', function(req, res) {
    var status = req.body["airdrop_status"];
    set_drop_status(status);

    res.send('Airdrop status sent');
});

app.post('/reset', function(req, res) {
    if(auto_airdrop_status === "true") {
        set_drop_status("waiting for optimal time");
        autoDrop = setInterval(function(){ drop_if_in_range() }, 50);

    } else {
        set_drop_status("carrying");

    }

    res.send('Payload reset');
});












//Manually triggered to drop when optimal
app.put('/manual_drop', function(req, res) {
    if(airdrop_status === "dropped") {
        io.emit("invalid_action");
    } else {
        set_drop_status("waiting for optimal time");
        autoDrop = setInterval(function(){ drop_if_in_range() }, 50);
    }
    res.send("Optimal drop initiated");
});

//Manually triggered to drop immediately
app.post('/manual_drop', function(req, res) {
    if(airdrop_status === "dropped") {
        io.emit("invalid_action");
    } else {
        request.post(
            'http://128.253.51.87/plane/release_bottle',
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    io.emit("add_drop", body);
                }
            }
        );

        set_drop_status("dropped");

        res.send("Manual immediate release completed")
    }
});










http.listen(3000, "0.0.0.0", function(){
    console.log('listening on *:3000');
});


