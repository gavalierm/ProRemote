//api
var remoteWebSocket;
var global_warr_timer;
var global_connection_timer;
var global_library = new Array(); //used for search

if (isNa(host)) {
    var host = 'localhost';
}
if (isNa(port)) {
    var port = '50000';
}
if (isNa(pass)) {
    var pass = 'control';
}
if (isNa(quality)) {
    var quality = '400';
}

if (isNa(localStorage.getItem("_host"))) {
    localStorage.setItem("_host", host);
}
if (isNa(localStorage.getItem("_port"))) {
    localStorage.setItem("_port", port);
}
if (isNa(localStorage.getItem("_pass"))) {
    localStorage.setItem("_pass", pass);
}
if (isNa(localStorage.getItem("_quality"))) {
    localStorage.setItem("_quality", quality);
}

function connect() {
    // Hide authenticate segment
    $("#authenticate").hide();
    // Display connecting to host text
    showWarr('connect');
    // Fade-in the loader and text
    $("#connecting-loader").fadeIn();
    // Show disconnected status
    $("#status").attr("class", "disconnected");
    // Set WebSocket uri
    wsUri = "ws://" + localStorage.getItem("_host") + ":" + localStorage.getItem("_port");
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
    // Show disconnected status
    showWarr("offline");
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
    //
    signalReceived();
    //
    $("body").removeClass("_loader");
    console.log(obj.action, obj);
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
        return getCurrentSlide();
    } else if (obj.action == "presentationCurrent") {
        //this is trigered when user click on slide in different presentation
        //cation: this is returned when you request for data /// this is confusing
        //predentationCurret is returned even in propresenter is not requested uuid current
        //when you request for song A, and song B is selected in PP, you get this Current state for song A, but reality is that "current" is still the B
        var data = "<div>Never happend</div>";

        //create presentation object from reponse
        var item = parsePath(obj.presentationPath);
        //store received-uuid
        var presentation = createPresentation(obj.presentation);
        //check last state
        // this stupid method is because API do reponse with same action for two different requests..
        //after first fill

        if (item.uuid !== $('body').data('selected-uuid')) {
            //my request?
            if (item.uuid == $('body').data('my-uuid') || "current" == $('body').data('my-uuid')) {
                console.log("my-uuid", $('body').data('my-uuid'));
                $("body").removeAttr('data-my-uuid');
                $("#presentation_target").html(presentation);
                $('body').data('selected-uuid', item.uuid);
                $('body').data('selected-title', item.title);
                return selectPresentation();
            }
            console.log("Not mine");
            //$('body').data('received-uuid', item.uuid);
            if ($('body').hasClass("live_mode")) {
                console.log("live mode enabled filling control");
                $("#presentation_target").html(presentation);
                $('body').data('selected-uuid', item.uuid);
                $('body').data('selected-title', item.title);
                return selectPresentation();
            }

            if (!$("#presentation_target .presentation").length) {
                console.log("data received and empty", item.uuid, item.title);
                //$("#presentation_target").html(presentation);
                //$('body').data('selected-uuid', item.uuid);
                //$('body').data('selected-title', item.title);
                return false;
            }
        }
        //return getCurrentSlide();
        return selectPresentation();

    } else if (obj.action == "presentationTriggerIndex") {
        //this will be trigered every time when sombody click on slide
        //use carefullz
        var item = parsePath(obj.presentationPath);
        //store actual received data

        $('body').data('received-uuid', item.uuid);
        $('body').data('received-index', obj.slideIndex);

        if (item.uuid !== $('body').data('selected-uuid')) {
            // i have different presentation opened
            if ($('body').hasClass("live_mode")) {
                console.log("get presentation");
                return getPresentation(obj.presentationPath);
            }
            $("body").addClass("some_selected");
            return signalReceived();
            //return showWarr("observe_mode", 'presentationTriggerIndex');
        }
        //have same presentation
        $('body').data('selected-index', obj.slideIndex);
        $('body').removeAttr('data-received-index');
        return selectSlide();
    } else if (obj.action == "presentationSlideIndex") {
        //this will be return only when i request for it
        //always return index of actual selected presentation in propresenter
        //not very usefull
        $('body').data('selected-index', obj.slideIndex);
        $("body").addClass("some_selected");
    } else if (obj.action == "clearText") {
        $('.presentation_slide.selected').addClass('cleared');
    }
}


//API
function getCurrentSlide() {
    remoteWebSocket.send('{"action":"presentationSlideIndex"}');
}

function getLibrary() {
    loader();
    remoteWebSocket.send('{"action":"libraryRequest"}');
}

function getPresentation(path) {
    loader();
    if (path === "current") {
        //return getCurrentSlide();
        remoteWebSocket.send('{"action": "presentationCurrent", "presentationSlideQuality": "' + localStorage.getItem("_quality") + '"}');
    } else {
        remoteWebSocket.send('{"action": "presentationRequest","presentationPath": "' + path + '", "presentationSlideQuality": "' + localStorage.getItem("_quality") + '"}');
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
        //console.log(groups_helper.indexOf(hash));
        if (groups_helper.indexOf(item.library.uuid) === -1) {
            groups_helper.push(item.library.uuid);
            groups.push({ 'title': item.library.title, 'uuid': item.library.uuid, 'counter': 1, 'items': [item] }); //Library name
        } else {
            groups[groups_helper.indexOf(item.library.uuid)]['items'].push(item);
            groups[groups_helper.indexOf(item.library.uuid)]['counter'] = groups[groups_helper.indexOf(item.library.uuid)]['counter'] + 1;
        }
        global_library.push(item);
    }

    //global_library = groups;

    var group_html = '';
    for (var i = 0; i <= groups.length - 1; i++) {
        var group = groups[i];
        // Add the library if required
        //console.log(group);
        var item_html = '';
        for (var x = 0; x <= group.items.length - 1; x++) {
            var item = group.items[x];
            var item_html = item_html + `<div class="presentation_item item library_item _trigger uuid_${item.uuid}" data-path="${item.path}"><div class="item_content"><div class="item_title">${item.title}</div><div class="item_group_title">${item.library.title}</div></div></div>`;
        }

        group_html = group_html + `<div class='group'><div class="group_title">${group.title}</div><div class="items">${item_html}</div></div>`;
    }

    //console.log(group_html);
    return group_html;
}

function createPresentation(presentation) {

    //console.log(presentation);

    var presentation_html = new Array();

    var slideIndex = 0;

    if (isNa(presentation.presentationCurrentLocation)) {
        console.log("createPresentation", "no location");
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

            if (!isNa($('body').data('selected-index')) && parseInt($('body').data('selected-index'), 10) == slideIndex) {
                //item_classes.push('selected');
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
            //
            var slideText = getSlideText(slide.slideText);
            //
            var item_html = `<div id="index_${slideIndex}" class="presentation_slide item ${item_classes.join(' ')||''} _trigger" data-index="${slideIndex}"><div class="cont" ${borderColor}><div class="thumb">${image||''}</div><div class="text">${slideText||''}</div><div class="label" ${labelColor}><span class="index">${slideIndex + 1}</span><span class="group_label">${groupName}</span><span class="slide_label">${slide.slideLabel}</span></div></div></div>`;
            presentation_html.push(item_html);
            slideIndex = slideIndex + 1;
            item
        }
    }
    if (presentation_html.length > 0) {
        return `<div id="uuid_${uuid}" class="presentation padder" data-path="${presentation.presentationCurrentLocation}">` + presentation_html.join('') + `</div>`;
    }
}

function triggerPresentation(path) {
    console.log("triggerPresentation", path);
    var uuid = path;
    if (path !== "current") {
        var item = parsePath(path);
        uuid = item.uuid;
    }
    $("body").data('my-uuid', uuid);
    return getPresentation(path);
}


function triggerSlide(path, index) {
    //console.log("triggerSlide", path, index);
    if (!isLive()) {
        return showWarr("observe_mode", '');
    }
    if (isNa(path) || isNa(index)) {
        console.log("No path or index in triggerSlide", path, index);
        return false;
    }
    // Get the slide index
    index = parseInt(index, 10);

    var item = parsePath(path);
    $("body").data('my-uuid', item.uuid);
    $("body").data('my-index', index);
    // Check if this is a playlist or library presentation
    if (!isNaN(path.charAt(0))) {
        console.warn("in playlist");
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + path + '"}');
        // Check if we should follow ProPresenter
    } else {
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + path.replace(/\//g, "\\/") + '"}');
        // Check if we should follow ProPresenter
    }
}

function triggerSlideNav(index) {
    if (!isLive()) {
        return showWarr("observe_mode", '');
    }
    if (index == "_prev") {
        remoteWebSocket.send('{"action":"presentationTriggerPrevious"}');
        return;
    } else if (index == "_clear") {
        remoteWebSocket.send('{"action":"clearText"}');
        return;
    } else if (index == "_next") {
        remoteWebSocket.send('{"action":"presentationTriggerNext"}');
        return;
    }
    console.warn("Not valid Nav", index);
}

function selectPresentation() {

    var uuid = $('body').data('selected-uuid');
    var title = $('body').data('selected-title');

    if (isNa(uuid)) {
        return console.warn("no uuid", uuid, title);
    }

    var target = ".uuid_" + uuid;
    console.log('selectPresentation', target, title);
    //
    $(".presentation_item").removeClass("selected");
    $(target).addClass("selected");
    $("body").addClass(["was_selected", "some_selected"]);
    $('.active_presentation_title').html(title);
    return openPanel("_panel_control");
}


function selectSlide() {

    var uuid = $('body').data('selected-uuid');
    var index = $('body').data('selected-index');

    if (isNa(uuid) || isNa(index)) {
        return console.warn("no uuid and index", uuid, index);
    }

    var target = "#uuid_" + uuid + " #index_" + index;
    console.log('selectSlide', target);
    //
    $("#uuid_" + uuid + " .presentation_slide").removeClass(["cleared", "selected"]);
    $(target).addClass("selected");
    $("body").addClass(["was_selected", "some_selected"]);
    return openPanel("_panel_control");
}

function parsePath(path, library_only = false) {
    if (isNa(path)) {
        console.log("parsePath", "invalid path", path);
        return false;
    }
    var pathSplit = path.split("/").reverse();

    var library = { 'title': pathSplit[1], 'uuid': md5('library_' + pathSplit[1]) };
    var item = { 'title': pathSplit[0].replace(/\.pro6/g, '').replace(/\.pro7/g, '').replace(/\.pro/g, ''), 'filename': pathSplit[0], 'path': path, 'uuid': md5('item_' + pathSplit[0]), 'library': library }

    if (library_only) {
        return library;
    }
    return item;
}



function triggerDo(target) {
    console.log("triggerDo", target);

    switch (target) {
        case "_live_mode":
            if ($('body').hasClass("live_mode")) {
                $('body').removeClass("live_mode");
                return showWarr("live_mode", 'disabled');
            } else {
                $('body').addClass("live_mode");
                return showWarr("live_mode", 'enabled');
            }
        case "_clear_loader":
            return loader(true); //true mean s clear
    }
}



function getSlideText(slideText) {
    if (slideText != null) {
        return slideText.replace(/\r|\n|\x0B|\x0C|\u0085|\u2028|\u2029/g, "<br>");
    } else {
        return "";
    }
}

function getRGBValue(int) {
    return Math.round(255 * int);
}

let loaderTimeout;
async function loader(clear = false) {
    clearTimeout(loaderTimeout);
    $("body").addClass("_loader");
    if (clear) {
        $("body").removeClass(["_loader_cancel", "_loader"]);
    } else {
        signalTimeout = setTimeout(function() {
            $("body").addClass("_loader_cancel");
            signalTimeout = setTimeout(function() {
                loader(true);
            }, 10000);
        }, 5000);
    }
}


let signalTimeout;
async function signalReceived() {
    clearTimeout(signalTimeout);
    $("body").addClass("signal");
    signalTimeout = setTimeout(function() {
        $("body").removeClass("signal");
    }, 200);
}

async function showWarr(warr = null, response = null) {
    clearTimeout(global_warr_timer);
    var time = 2000;
    //show error message;
    $("#status_message").removeClass(["white", "red", "green", "blue", "orange"]);
    switch (warr) {
        case "connect":
            time = null;
            $("#status_message").addClass("white");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i>' + ' ' + "Connecting to " + localStorage.getItem('_host') + ":" + localStorage.getItem('_port'));
            break;
        case "online":
            $("#status_message").addClass("green");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i>' + ' ' + "Online");
            break;
        case "offline":
            time = 3000;
            $("#status_message").addClass("red");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i> Connection failed to ' + localStorage.getItem('_host') + ":" + localStorage.getItem('_port'));
            break;
        case "login_success":
            $("#status_message").addClass("green");
            $("#warr_message").html('<i class="fa-solid fa-fingerprint"></i> Connection estabslished');
            break;
        case "login_wrong_credentials":
            $("#status_message").addClass("red");
            $("#warr_message").html('<i class="fa-solid fa-fingerprint"></i>' + ' ' + "Wrong credentials");
            break;
        case "observe_mode":
            $("#status_message").addClass("blue");
            $("#warr_message").html('<i class="fa-solid fa-link"></i>' + ' ' + "Observe mode");
            break;
        case "live_mode":
            if (response == 'enabled') {
                $("#status_message").addClass("red");
            } else {
                $("#status_message").addClass("white");
            }
            $("#warr_message").html('<i class="fa-solid fa-link"></i>' + ' ' + "Live mode " + response);
            break;
        default:
            $("#status_message").addClass("white");
            if (isNa(warr)) {
                warr = '';
            }
            $("#warr_message").html(warr + ' ' + response);
    }
    $("body").addClass("show_warr");
    if (time != null) {
        global_warr_timer = setTimeout(warrDismiss, time);
    }
    return false;
}

function isLive() {
    if ($('body').hasClass("live_mode")) {
        return true;
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