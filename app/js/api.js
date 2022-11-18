//api
var remoteWebSocket;
var global_warr_timer;
var global_connection_timer;
var global_library = new Array(); //used for search
var global_library_list = new Array(); //api has bug that do not send actual path, so we need create helper field with paths


async function storeConnection(auto_connect = true) {
    if (!isNa($("#setting_id" + "_host").val().trim())) {
        localStorage.setItem("_host", $("#setting_id" + "_host").val());
    } else {
        return showWarr("required_value", "Host");
    }
    if (!isNa($("#setting_id" + "_port").val().trim())) {
        localStorage.setItem("_port", $("#setting_id" + "_port").val());
    } else {
        return showWarr("required_value", "Port");
    }
    if (!isNa($("#setting_id" + "_pass").val().trim())) {
        localStorage.setItem("_pass", $("#setting_id" + "_pass").val());
    } else {
        return showWarr("required_value", "Password");
    }
    if (!isNa($("#setting_id" + "_quality").val().trim())) {
        localStorage.setItem("_quality", $("#setting_id" + "_quality").val());
    } else {
        return showWarr("required_value", "Quality");
    }
    if (!isNa($("#setting_id" + "_protocol").val().trim())) {
        localStorage.setItem("_protocol", $("#setting_id" + "_protocol").val());
    } else {
        return showWarr("required_value", "Protocol");
    }

    if (auto_connect) {
        connect();
    }
}

async function refillConnection() {
    //set stored settings into fields
    if (!isNa(localStorage.getItem("_host"))) {
        $("#setting_id" + "_host").val(localStorage.getItem("_host"));
    }
    if (!isNa(localStorage.getItem("_port"))) {
        $("#setting_id" + "_port").val(localStorage.getItem("_port"));
    }
    if (!isNa(localStorage.getItem("_pass"))) {
        $("#setting_id" + "_pass").val(localStorage.getItem("_pass"));
    }
    if (!isNa(localStorage.getItem("_quality"))) {
        $("#setting_id" + "_quality").val(localStorage.getItem("_quality"));
    }
    if (!isNa(localStorage.getItem("_protocol"))) {
        $("#setting_id" + "_protocol").val(localStorage.getItem("_protocol"));
    }
}

async function storeFilters() {
    if (!isNa($("#setting_id" + "_filter_a").val().trim())) {
        localStorage.setItem("_filter_a", $("#setting_id" + "_filter_a").val());
    }

    if (!isNa($("#setting_id" + "_filter_b").val().trim())) {
        localStorage.setItem("_filter_b", $("#setting_id" + "_filter_b").val());
    }

    if (!isNa($("#setting_id" + "_filter_c").val().trim())) {
        localStorage.setItem("_filter_c", $("#setting_id" + "_filter_c").val());
    }

    refillFilters();
}

async function refillFilters() {
    if (!isNa(localStorage.getItem("_filter_a"))) {
        $("#setting_id" + "_filter_a").val(localStorage.getItem("_filter_a"));
        $("." + "_filter_a" + "_trigger._do").attr("data-fill", localStorage.getItem("_filter_a")).data('fill', localStorage.getItem("_filter_a"));
        $("." + "_filter_a" + "_trigger._do .inner").html(localStorage.getItem("_filter_a"));
    }

    if (!isNa(localStorage.getItem("_filter_b"))) {
        $("#setting_id" + "_filter_b").val(localStorage.getItem("_filter_b"));
        $("." + "_filter_b" + "_trigger._do").attr("data-fill", localStorage.getItem("_filter_b")).data('fill', localStorage.getItem("_filter_b"));
        $("." + "_filter_b" + "_trigger._do .inner").html(localStorage.getItem("_filter_b"));
    }
    if (!isNa(localStorage.getItem("_filter_c"))) {
        $("#setting_id" + "_filter_c").val(localStorage.getItem("_filter_c"));
        $("." + "_filter_c" + "_trigger._do").attr("data-fill", localStorage.getItem("_filter_c")).data('fill', localStorage.getItem("_filter_c"));
        $("." + "_filter_c" + "_trigger._do .inner").html(localStorage.getItem("_filter_c"));
    }

}

function connect() {
    clearTimeout(global_connection_timer);
    if (isNa(localStorage.getItem("_host")) || isNa(localStorage.getItem("_port")) || isNa(localStorage.getItem("_pass")) || isNa(localStorage.getItem("_quality")) || isNa(localStorage.getItem("_protocol"))) {
        //no credentials
        return false;
    }
    //
    showWarr('connect');
    //
    if (remoteWebSocket) {
        console.error('Socket opened before reconnect: Closing socket');
        remoteWebSocket.close();
    }
    wsUri = "ws://" + localStorage.getItem("_host") + ":" + localStorage.getItem("_port");
    remoteWebSocket = new WebSocket(wsUri + "/remote");
    remoteWebSocket.onopen = function() { onOpen(); };
    remoteWebSocket.onclose = function() { onClose(); };
    remoteWebSocket.onmessage = function(evt) { onMessage(JSON.parse(evt.data)); };
    remoteWebSocket.onerror = function(evt) { onError(evt); };
}

async function onError(evt) {
    disconnected();
    if (remoteWebSocket) {
        console.error('Socket encountered error: ', evt.message, 'Closing socket');
        remoteWebSocket.close();
    }
}

async function onClose() {
    disconnected();
    clearTimeout(global_connection_timer);
    global_connection_timer = setTimeout(function() {
        connect();
    }, 5000);
}

async function onOpen() {
    connected();
    clearTimeout(global_connection_timer);
    remoteWebSocket.send('{"action":"authenticate","protocol":"' + localStorage.getItem("_protocol") + '","password":"' + localStorage.getItem("_pass") + '"}');
}

async function onMessage(obj) {
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
    if (obj.action == "authenticate" && parseInt(obj.authenticated, 10) == 1) {
        authenticated();
        return getLibrary();
    } else if (obj.action == "authenticate" && parseInt(obj.authenticated, 10) == 0) {
        return showWarr("login_wrong_credentials");
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

        var action = "presentationCurrent";

        //v7
        if (isNa(obj.presentationDestination)) {
            console.log("No presentationDestination");
            //in version 7 presentationRequest do not include this
            //in version 6 this is never included
            action = "presentationRequest"; //for version 7

            if (!isNa(obj.presentationPath) && localStorage.getItem("_protocol") == "601") {
                console.log("No presentationPath AND version 6 it means Current action");
                //this happend only in version 6 because version 7 include this in both responses
                action = "presentationCurrent";
            }
            //
            obj.action = action;
        }

        if (isNa(obj.presentationPath)) {
            if (obj.presentation.presentationName) {
                obj.presentationPath = obj.presentation.presentationName;
            } else {
                console.error("Not possible parse name", obj.presentation);
                return false;
            }
        }

        console.log("Actual action", obj);
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
                return getPresentation(item.path);
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
        if (isNa(global_library_list[item.uuid])) {
            global_library_list[item.uuid] = item.path;
        } else {
            console.error("Duplicate item", global_library_list[item.uuid]);
        }


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
    //return false;
    var presentation_html = new Array();

    var slideIndex = 0;

    if (isNa(presentation.presentationName)) {
        console.log("createPresentation", "no presentationName");
        return false;
    }

    var item = parsePath(presentation.presentationName);

    var uuid = item.uuid;

    //console.log(item, uuid);

    for (var i = 0; i <= presentation.presentationSlideGroups.length - 1; i++) {
        var group = presentation.presentationSlideGroups[i];
        //console.log(group);

        var groupName = null;
        if (!isNa(group.groupName)) {
            groupName = group.groupName;
        }
        var groupColor = null;
        var groupColor_text = null;

        if (!isNa(group.groupColor)) {
            groupColor = group.groupColor.split(' ');
            groupColor[0] = getRGBValue(groupColor[0]);
            groupColor[1] = getRGBValue(groupColor[1]);
            groupColor[2] = getRGBValue(groupColor[2]);

            if ((groupColor[0] + groupColor[1] + groupColor[2]) > 375) {
                //this means that slide have to bright color
                groupColor_text = true;
            }

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
                //console.log(slide.slideText.length, unescape(slide.slideText));
                slide.slideText = slide.slideText.trim();
                //
                slide.slideText = slide.slideText.replace(/^\x82+|\x82+$/gm, '').trim();
                //
            }

            if (isNa(slide.slideText)) {
                item_classes.push('no_text');
            } else {
                if (slide.slideText.length > 500) {
                    item_classes.push('long_text');
                }
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
            var slideColor_text = null;
            if (!isNa(slide.slideColor)) {
                slideColor = slide.slideColor.split(' ');
                slideColor[0] = getRGBValue(slideColor[0]);
                slideColor[1] = getRGBValue(slideColor[1]);
                slideColor[2] = getRGBValue(slideColor[2]);
                if ((slideColor[0] + slideColor[1] + slideColor[2]) > 375) {
                    //this means that slide have to bright color
                    slideColor_text = true;
                }
                slideColor = slideColor.join(',');
            } else if (groupColor) {
                slideColor = groupColor;
                slideColor_text = groupColor_text;
            }
            var borderColor = null;
            var labelColor = null;
            if (slideColor && slideColor != '0,0,0,0') {
                if (slideColor_text) {
                    item_classes.push('bright_color');
                }
                var borderColor = `style="border-color:rgb(${slideColor});"`;

                var labelColor = `style="background-color:rgb(${slideColor});"`;
            }
            //
            var slideText = getSlideText(slide.slideText);
            //
            var item_html = `<div id="index_${slideIndex}" class="presentation_slide item ${item_classes.join(' ')||''} _trigger" data-index="${slideIndex}"><div class="cont" ${borderColor}><div class="content"><div class="text">${slideText||''}</div><div class="thumb">${image||''}</div></div><div class="label_cont" ${labelColor}><div class="label"><span class="index">${slideIndex + 1}</span><span class="group_label">${groupName || ''}</span><span class="slide_label">${slide.slideLabel || ''}</span></div><div class="slide_actions"><div class="slide_action swap no-prop _do" data-do="_swap"><i class="fa-solid fa-image"></i></div></div></div></div></div>`;
            presentation_html.push(item_html);
            slideIndex = slideIndex + 1;
        }
    }
    if (presentation_html.length > 0) {
        return `<div id="uuid_${uuid}" class="presentation padder" data-path="${presentation.presentationName}">` + presentation_html.join('') + `</div>`;
    }
}

function triggerPresentation(path) {
    console.log("triggerPresentation", path);
    var uuid = path;
    if (path !== "current") {
        var item = parsePath(path);
        uuid = item.uuid;
        path = item.path;
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


    console.log("Triggering slide", item);

    $("body").data('my-uuid', item.uuid);
    $("body").data('my-index', index);
    // Check if this is a playlist or library presentation
    if (!isNaN(item.path.charAt(0))) {
        console.warn("in playlist");
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + item.path + '"}');
        // Check if we should follow ProPresenter
    } else {
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + item.path.replace(/\//g, "\\/") + '"}');
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

    return openPanel("_panel_control", function() { $("#automove_target").scrollTop(0); });
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
    //with callback
    if ($('body').hasClass("live_mode")) {
        return openPanel("_panel_control", autoMoveStep);
    }
}

function parsePath(path, library_only = false) {
    if (isNa(path)) {
        console.log("parsePath", "invalid path", path);
        return false;
    }
    var pathSplit = path.split("/").reverse();


    if (pathSplit.length < 2) {
        //this is name only
        console.log("No presentationPath in parsePath", localStorage.getItem("_protocol"));
        //we need generate path from helper array
        var uuid = md5('item_' + path.replace(/\.pro6/g, '').replace(/\.pro7/g, '').replace(/\.pro/g, '')); //prefix in createLibrary
        if (isNa(global_library_list[uuid])) {
            console.error("Not possible get path from helper array", path, uuid);
            return false;
        }
        path = global_library_list[uuid];
        pathSplit = path.split("/").reverse();
    }


    var library = { 'title': pathSplit[1].replace(/ProPresenter6/g, 'Library'), 'uuid': md5('library_' + pathSplit[1]) };
    var item_file = pathSplit[0].replace(/\.pro6/g, '').replace(/\.pro7/g, '').replace(/\.pro/g, '');
    var item = { 'title': item_file, 'filename': pathSplit[0], 'path': path, 'uuid': md5('item_' + item_file), 'library': library }

    if (library_only) {
        return library;
    }
    return item;
}



function getSlideText(slideText) {
    if (slideText != null) {

        //add br
        slideText = slideText.replace(/\n|\x0B|\x0C|\u0085|\u2028|\u2029/g, "<br>");
        //
        slideText = slideText.trim();
        //
        slideText = slideText.replace(/^\x82+|\x82+$/gm, '');
        //add box
        slideText = slideText.replace(/\r/g, '</div><div class="box">');
        //
        return `<div class="box">${slideText}</div>`;

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
        case "required_value":
            $("#status_message").addClass("orange");
            $("#warr_message").html('<i class="fa-solid fa-fingerprint"></i>' + ' ' + "Required: " + response);
            break;
        case "connect":
            time = null;
            $("#status_message").addClass("white");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i>' + ' ' + "Connecting to " + localStorage.getItem('_host') + ":" + localStorage.getItem('_port'));
            break;
        case "connected":
            $("#status_message").addClass("green");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i>' + ' ' + "Connected" + localStorage.getItem('_host') + ":" + localStorage.getItem('_port'));
            break;
        case "disconnected":
            time = 3000;
            $("#status_message").addClass("red");
            $("#warr_message").html('<i class="fa-solid fa-cloud"></i> Connection failed to ' + localStorage.getItem('_host') + ":" + localStorage.getItem('_port'));
            break;
        case "authenticated":
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

async function connected() {
    if ($('body').hasClass("_panel_settings_first")) {
        openPanel("_panel_control");
    }
    $("body").removeClass("disconnected");
    $("body").addClass("connected");
    showWarr("connected");
}

async function disconnected() {
    $("body").removeClass("authenticated");
    $("body").removeClass("connected");
    $("body").addClass("disconnected");
    showWarr("disconnected");
}

async function authenticated() {
    if ($('body').hasClass("_panel_settings_first")) {
        openPanel("_panel_control");
    }
    $("body").removeClass("disconnected");
    $("body").addClass("authenticated");
    showWarr("authenticated");
}

$(document).ready(function() {
    refillConnection();
    refillFilters();
    connect();
});