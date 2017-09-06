/**
 * Created by brody on 9/5/2017.
 */

//Links elements to backend using socket.io
function linkSockets() {
    var socket = io();

    socket.on('airdrop_status', function (msg) {
        $('#airdrop_status').text(msg);
    });

    socket.on('add_drop', function (msg) {
       // $('#drops').append($('<li>').text(JSON.parse(msg).release_location.x));
        $('#drops').append($('<li class="drop_item">').text(msg));
    });

    socket.on('auto_airdrop_status', function (msg) {
        if (msg === "true") {
            $('#auto_airdrop_switch').prop('checked', true);
        } else {
            $('#auto_airdrop_switch').prop('checked', false);
            console.log("check removed");
        }

    });

    socket.on('invalid_action', function () {
        $('#need-to-reset-modal').modal();
    });


}


//Initializes page data to current server values
function initializeData() {
   $.ajax({
        type: "GET",
        url: "/airdrop_status"
    }).then(function(data) {
        var status = JSON.parse(data).airdrop_status;
        $('#airdrop_status').text(status);
    });
}

//Adds event listeners to controls on page
function addEventListeners() {
    $('#auto_airdrop_switch').click(function () {
        $.post(this.checked ? "/auto_airdrop_on" : "/auto_airdrop_off");
    });


    $('#reset_airdrop_status_button').click(function () {
        $.post("/reset");
    });

    $('#optimal_manual_drop_button').click(function () {
        jQuery.ajax({
            type: 'PUT',
            url: '/manual_drop'
        });
    });
    $('#immediate_manual_drop_button').click(function () {
        $.post("/manual_drop");
    });

    $('#clear_drops_button').click(function () {
        $("#drops").html("");
    })


}

$(document).ready(function() {

    //if time: add stylesheet to switches
    /*var elem = document.querySelector('.js-switch');
     var init = new Switchery(elem);*/

    initializeData();
    linkSockets();
    addEventListeners();

    $.post("/auto_airdrop_off");
    $.post("/reset");
});

var location_dot = document.getElementById("location_icon");


//if time: move to backend
setInterval(function(){
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "http://128.253.51.87/plane/state"
    }).then(function(data) {
        var x = data.plane_location.x;
        var y = data.plane_location.y;
        var vx = data.plane_velocity.vx;
        var vy = data.plane_velocity.vy;

        var distance = Math.sqrt(Math.pow((parseFloat(x)-135.0), 2) + Math.pow((parseFloat(y)-100.0),2));

        $("#location_div").css({
            "left": x - 15,
            "top": -y + 210
        });

        $("#x_pos").text(x);
        $("#y_pos").text(y);
        $("#x_vel").text(vx);
        $("#y_vel").text(vy);
        $("#distance_from_target").text(distance);
    });
}, 100);