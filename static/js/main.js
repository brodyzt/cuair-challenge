/**
 * Created by brody on 9/5/2017.
 */

function relative_x_location(x, size) {
    var ratio = 468.0/255;
    return x * ratio + 15 - (size / 2.0);
}

function relative_y_location(y, size) {
    var ratio = 468.0/255;
    return (-1 * y * ratio) + 468 + 15 - (size / 2.0);
}

class Drop {
    constructor(signal_x, signal_y, drop_x, drop_y, dist) {
        this.signal_x = signal_x;
        this.signal_y = signal_y;
        this.drop_x = drop_x;
        this.drop_y = drop_y;
        this.dist = dist;
    }
}

var drops = [];



function display_drop_data(index) {
    $("#drop_data_modal").html(
        '<div class="modal-dialog" role="document">' +
        '            <div class="modal-content">' +
        '                <div class="modal-header">' +
        '                    <h5 class="modal-title">Drop ' + (index + 1) + '</h5>' +
        '                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
        '                        <span aria-hidden="true">&times;</span>' +
        '                    </button>' +
        '                </div>' +
        '                <div class="modal-body">' +
        '                  <div id="drop_data_map">' +
        '                       <div id="drop_data_target"><img src="/img/target.png" class="target_icon"></div>' +
        '                       <div id="drop_data_release"><img src="/img/release.png" class="release_icon"></div>' +
        '                       <div id="drop_data_hit"><img src="/img/hit.png" class="hit_icon"></div>' +
        '                   </div>' +
        '                   <hr>' +
        '                       <p>Distance From Target: ' + drops[index].dist + ' units</p>' +
        '                   </hr>' +
        '                   <ul>' +
        '                       <li>Release location: <img src="/img/release.png" class="release_icon"></li>' +
        '                       <li>Hit location: <img src="/img/hit.png" class="hit_icon"></li>' +
        '                   </ul>' +
        '                </div>' +
        '            </div>' +
        '        </div>');
    $('#drop_data_target').css({
        "left": relative_x_location(135, 50),
        "top": relative_y_location(100, 50)
    });
    $('#drop_data_release').css({
        "left": relative_x_location(drops[index].signal_x, 30),
        "top": relative_y_location(drops[index].signal_y, 30)
    });
    $('#drop_data_hit').css({
        "left": relative_x_location(drops[index].drop_x, 30),
        "top": relative_y_location(drops[index].drop_y, 30)
    });
    $('#drop_data_modal').modal();


}

//Links elements to backend using socket.io
function linkSockets() {
    var socket = io();

    socket.on('airdrop_status', function (msg) {
        $('#airdrop_status').text(msg);
    });

    socket.on('add_drop', function (msg) {
        var data = JSON.parse(msg);
        var new_drop = new Drop(data.release_location.x,data.release_location.y,data.hit_location.x,data.hit_location.y,data.dist_from_target);
        drops.push(new_drop);
        var text = "Drop " + drops.length + ": " + Math.round(new_drop.dist * 100) / 100 + " units";

        $('#drops').append('<li class="drop_item" style="display: inline-block">'
            + text + '<button class="btn btn-primary" style="float: right" onclick="display_drop_data(' + (drops.length - 1) + ')">View Drop</button></li>');
    });

    socket.on('auto_airdrop_status', function (msg) {
        if (msg === "true") {
            $('#auto_airdrop_switch').prop('checked', true);
        } else {
            $('#auto_airdrop_switch').prop('checked', false);
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
            url: '/auto_drop'
        });
    });
    $('#immediate_manual_drop_button').click(function () {
        $.post("/manual_drop");
    });

    $('#clear_drops_button').click(function () {
        drops = []
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
    drops = [];
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