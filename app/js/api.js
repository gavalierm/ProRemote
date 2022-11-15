//api
var remoteWebSocket;
var global_warr_timer;
var global_connection_timer;
var global_path_helper = new Array();

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
if (isNa(quality)) {
    var quality = '400';
    if (localStorage.getItem("_quality")) {
        quality = localStorage.getItem("_quality");
    }
}

function connect() {
    // Hide authenticate segment
    $("#authenticate").hide();
    // Display connecting to host text
    showWarr("Connecting to " + host, '');
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

function onError(evt) {
    authenticated = false;
    if (remoteWebSocket) {
        console.error('Socket encountered error: ', evt.message, 'Closing socket');
        remoteWebSocket.close();
    }
    showWarr("offline");
}

function onClose() {
    authenticated = false;
    // Show disconnected status
    $("#status").attr("class", "disconnected");
    // If retry connection is enabled
    clearTimeout(global_connection_timer);
    global_connection_timer = setTimeout(function() {
        connect();
    }, 5000);
}

function onOpen() {
    //if (!authenticated) {
    clearTimeout(global_connection_timer);
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
        showWarr("login_success");
        return getLibrary();
    } else if (obj.action == "libraryRequest") {
        var data = "";

        var library = createLibrary(obj.library);
        if (library) {
            data = library;
        }
        $("#library_target").html(data);
    } else if (obj.action == "presentationCurrent") {
        var data = "<div>No data</div>";

        var presentation = createItem(obj.presentation);
        if (presentation) {
            data = presentation;
        }
        $("#presentation_target").html(data);
        return openPanel('_panel_control');
    } else if (obj.action == "presentationTriggerIndex") {
        return selectSlide(obj.presentationPath, obj.slideIndex);
    }
}


//API
function getLibrary() {
    remoteWebSocket.send('{"action":"libraryRequest"}');
}

function getPresentation(path = null) {
    console.log(path);
    if (path === null) {
        remoteWebSocket.send('{"action":"presentationCurrent", "presentationSlideQuality": "' + quality + '"}');
    } else {
        remoteWebSocket.send('{"action": "presentationRequest","presentationPath": "' + path + '", "presentationSlideQuality": "' + quality + '"}');
    }
}




function createLibrary(library) {

    library.sort();

    //console.log(library);

    var groups = new Array();
    var groups_helper = new Array();
    //crate gourps
    for (var i = 0; i <= library.length - 1; i++) {
        var group = library[i];
        //
        var item = parsePath(group);
        //store into global helper
        global_path_helper[item.uuid] = item.path;
        //console.log(groups_helper.indexOf(hash));
        if (groups_helper.indexOf(item.library.uuid) === -1) {
            groups_helper.push(item.library.uuid);
            groups.push({ 'title': item.library.title, 'uuid': item.library.uuid, 'counter': 1, 'items': [item] }); //Library name
        } else {
            groups[groups_helper.indexOf(item.library.uuid)]['items'].push(item);
            groups[groups_helper.indexOf(item.library.uuid)]['counter'] = groups[groups_helper.indexOf(item.library.uuid)]['counter'] + 1;
        }
    }



    var group_html = '';
    for (var i = 0; i <= groups.length - 1; i++) {
        var group = groups[i];
        // Add the library if required
        //console.log(group);
        var item_html = '';
        for (var x = 0; x <= group.items.length - 1; x++) {
            var item = group.items[x];
            var item_html = item_html + `<div class="item library_item _select" data-select="_item" data-id="${item.uuid}"><div class="item_content"><div class="item_title">${item.title}</div><div class="item_group_title">${item.library.title}</div></div></div>`;
        }

        group_html = group_html + `<div class='group'><div class="group_title">${group.title}</div><div class="items">${item_html}</div></div>`;
    }

    //console.log(group_html);
    return group_html;
}

function createItem(presentation) {

    console.log(presentation);

    var presentation_html = new Array();

    var slideIndex = 1;

    if (isNa(presentation.presentationCurrentLocation)) {
        console.log("createItem", "no location");
        return false;
    }

    var item = parsePath(presentation.presentationCurrentLocation);

    var uuid = item.uuid;

    for (var i = 0; i <= presentation.presentationSlideGroups.length - 1; i++) {
        var group = presentation.presentationSlideGroups[i];
        //console.log(group);

        var groupName = null;
        if (!isNa(group.groupName)) {
            groupName = group.groupName;
        }
        var groupColor = null;
        if (!isNa(group.groupColor)) {
            groupColor = group.groupColor.split(' ');
            groupColor[0] = getRGBValue(groupColor[0]);
            groupColor[1] = getRGBValue(groupColor[1]);
            groupColor[2] = getRGBValue(groupColor[2]);
            groupColor = groupColor.join(',');
        }
        //group slides
        //group colors
        //group labels atc
        for (var x = 0; x <= group.groupSlides.length - 1; x++) {
            var slide = group.groupSlides[x];
            var item_classes = new Array();
            //console.log(slide);
            if (!isNa(slide.slideText)) {
                item_classes.push('has_text');
            }

            if (!slide.slideEnabled) {
                item_classes.push('disabled');
            }

            var image = null;
            if (slide.slideImage) {
                image = `<img src="data:image/png;base64,${slide.slideImage}">`;
            }
            var slideColor = null;
            if (!isNa(slide.slideColor)) {
                slideColor = slide.slideColor.split(' ');
                slideColor[0] = getRGBValue(slideColor[0]);
                slideColor[1] = getRGBValue(slideColor[1]);
                slideColor[2] = getRGBValue(slideColor[2]);
                slideColor = slideColor.join(',');
            } else if (groupColor) {
                slideColor = groupColor;
            }
            var borderColor = null;
            var labelColor = null;
            if (slideColor) {
                var borderColor = `style="border-color:rgb(${slideColor})"`;
                var labelColor = `style="background-color:rgb(${slideColor})"`;
            }
            var item_html = `<div id="index_${slideIndex}" class="item ${item_classes.join(' ')||''} _trigger" data-index="${slideIndex}"><div class="cont" ${borderColor}><div class="thumb">${image||''}</div><div class="text">${slide.slideText||''}</div><div class="label" ${labelColor}><span class="index">${slideIndex}</span><span class="group_label">${groupName}</span><span class="slide_label">${slide.slideLabel}</span></div></div></div>`;
            presentation_html.push(item_html);
            slideIndex = slideIndex + 1;
        }
    }
    if (presentation_html.length > 0) {
        return `<div id="uuid_${uuid}" class="presentation padder" data-path="${presentation.presentationCurrentLocation}">` + presentation_html.join('') + `</div>`;
    }

    return false;
}

function selectItem(uuid) {
    console.log(uuid);
    if (global_path_helper[uuid]) {
        return getPresentation(global_path_helper[uuid]);
    }
    return showWarr("uknown_path", uuid);
}


function triggerSlide(index, obj) {
    // Get the slide location
    var location = $(obj).parents('.presentation').data("path");
    if (isNa(location)) {
        return showWarr('_no_path', location);
    }
    // Get the slide index
    index = parseInt(index, 10) - 1;
    // Check if this is a playlist or library presentation
    if (!isNaN(location.charAt(0))) {
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + location + '"}');
        // Check if we should follow ProPresenter
    } else {
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + location.replace(/\//g, "\\/") + '"}');
        // Check if we should follow ProPresenter
    }
}



function selectSlide(path, slideIndex) {
    var item = parsePath(path);
    var target = "#uuid_" + item.uuid + " #index_" + (slideIndex + 1);
    console.log(target);
    $("#uuid_" + item.uuid + " .item.selected").removeClass("selected");
    $(target).addClass("selected");
}

function parsePath(path, library_only = false) {
    if (isNa(path)) {
        console.log("parsePath", "invalid path", path);
        return false;
    }
    var pathSplit = path.split("/").reverse();

    var library = { 'title': pathSplit[1], 'uuid': md5(pathSplit[1]) };
    var item = { 'title': pathSplit[0].replace(/\.pro6/g, '').replace(/\.pro7/g, '').replace(/\.pro/g, ''), 'filename': pathSplit[0], 'path': path, 'uuid': md5(pathSplit[0]), 'library': library }

    if (library_only) {
        return library;
    }
    return item;
}

function getRGBValue(int) {
    return Math.round(255 * int);
}

async function showWarr(warr = null, response = null) {
    clearTimeout(global_warr_timer);
    var time = 2000;
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
    $("#warr_message").html('<i class="fa-solid fa-info"></i>Message');
    $("body").removeClass("show_warr");
}

$(document).ready(function() {
    connect();
});