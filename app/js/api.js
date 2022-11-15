//api
var remoteWebSocket;
var global_warr_timer;

if (isNa(host)) {
    var host = 'localhost';
    if (localStorage.getItem("_host")) {
        host = localStorage.getItem("_host");
    }
}
if (isNa(port)) {
    var port = '50000';
    if (localStorage.getItem("_port")) {
        port = localStorage.getItem("_port");
    }
}
if (isNa(pass)) {
    var pass = 'control';
    if (localStorage.getItem("_pass")) {
        pass = localStorage.getItem("_pass");
    }
}

function connect() {
    // Hide authenticate segment
    $("#authenticate").hide();
    // Display connecting to host text
    $("#connecting-to").text("Connecting to " + host);
    // Fade-in the loader and text
    $("#connecting-loader").fadeIn();
    // Show disconnected status
    $("#status").attr("class", "disconnected");
    // Set WebSocket uri
    wsUri = "ws://" + host + ":" + port;
    remoteWebSocket = new WebSocket(wsUri + "/remote");
    remoteWebSocket.onopen = function() { onOpen(); };
    remoteWebSocket.onclose = function() { onClose(); };
    remoteWebSocket.onmessage = function(evt) { onMessage(evt); };
    remoteWebSocket.onerror = function(evt) { onError(evt); };
}


function onOpen() {
    //if (!authenticated) {
    remoteWebSocket.send('{"action":"authenticate","protocol":"701","password":"' + pass + '"}');
    //}
}

function onMessage(evt) {
    var obj = JSON.parse(evt.data);
    if (!obj.action) {
        console.log(obj);
        showWarr('no_action');
        return false;
    }
    if (obj.error) {
        console.log(obj);
        showWarr(null, obj.error);
        return false;
    }
    console.log(obj);
    if (obj.action == "authenticate" && obj.authenticated == "1") {
        getLibrary();
    } else if (obj.action == "libraryRequest") {
        var data = "";
        obj.library.forEach(function(item) {
            // Add the library if required
            data += createLibrary(item);
        });
        $("#library_target").html(data);
    }
}

function getLibrary() {
    remoteWebSocket.send('{"action":"libraryRequest"}');
}

function createLibrary(obj) {
    // Variable to hold the unique status of the library in the array
    var unique = true;
    // Variable to hold the split string of the presentation path
    var pathSplit = obj.split("/");
    // Variable to hold the name of the library, retrieved from the presentation path
    var libraryName = "";
    // Variable to hold the data of the library
    var libraryData = "";
    // Iterate through each item in the split path to retrieve the library name
    pathSplit.forEach(function(item, index) {
        if (item == "Libraries") {
            libraryName = pathSplit[index + 1];
        }
    });
    var title = pathSplit.reverse()[0];
    title = title.replace(/\.pro6/g, '').replace(/\.pro/g, '');
    var id = title;
    // Check if the library is unique and can be added in the array
    // If the library is unique
    if (unique) {
        // Add the library name to the library list
        //libraryList.push(libraryName);
        // Create the library data
        libraryData = '<div class="item library_item _select" data-select="_library" data-id="' + id + '"><div class="item_content"><div class="item_title">' + title + '</div></div></div>';
    }
    return libraryData;
}

async function showWarr(warr = null, response = null) {
    clearTimeout(global_warr_timer);
    var time = 5000;
    //show error message;
    $("#status_message").removeClass(["white", "red", "green", "blue", "orange"]);
    switch (warr) {
        case "online":
            $("#status_message").addClass("green");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i>' + ' ' + "Online");
            break;
        case "offline":
            $("#status_message").addClass("red");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i>' + ' ' + "Offline");
            break;
        case "login_success":
            $("#status_message").addClass("green");
            $("#warr_message").html('<i class="fa-solid fa-fingerprint"></i>Bol si prihlásený');
            break;
        case "login_wrong_credentials":
            $("#status_message").addClass("red");
            $("#warr_message").html('<i class="fa-solid fa-fingerprint"></i>' + ' ' + "Zlé prihlasovacie údaje");
            break;
        default:
            $("#status_message").addClass("white");
            if (isNa(warr)) {
                warr = '';
            }
            $("#warr_message").html(warr + response);
    }
    $("body").addClass("show_warr");
    if (time != null) {
        global_warr_timer = setTimeout(warrDismiss, time);
    }
    return false;
}

async function warrDismiss() {
    $("#warr_message").html("Message");
    $("body").removeClass("show_warr");
}

$(document).ready(function() {
    connect();
});