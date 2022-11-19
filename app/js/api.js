//api
var remoteWebSocket;
var global_warr_timer;
var global_connection_timer;
var global_library = new Array(); //used for search
var global_library_list = new Array(); //api has bug that do not send actual path, so we need create helper field with paths
var global_playlists = new Array(); //used for search
var global_playlists_list = new Array(); //api has bug that do not send actual path, so we need create helper field with paths


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

async function connect() {
    clearTimeout(global_connection_timer);
    if (isNa(localStorage.getItem("_host")) || isNa(localStorage.getItem("_port")) || isNa(localStorage.getItem("_pass")) || isNa(localStorage.getItem("_quality")) || isNa(localStorage.getItem("_protocol"))) {
        //no credentials
        return false;
    }
    //
    showWarr('connect');
    //
    if (remoteWebSocket) {
        console.warn('Socket opened before reconnect: Closing socket');
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
        return showWarr('no_action');
    }
    if (!isNa(obj.error)) {
        console.error(obj);
        openPanel("_panel_settings");
        disconnected();
        return showWarr("error", obj.error);
    }
    //
    signalReceived();
    //
    $("body").removeClass("_loader");
    console.log(obj.action, obj);
    if (obj.action == "authenticate" && parseInt(obj.authenticated, 10) == 1) {
        authenticated();
        getPlaylists()
        getLibrary();
        return false;
    } else if (obj.action == "authenticate" && parseInt(obj.authenticated, 10) == 0) {
        console.error("Not auth");
        return showWarr("login_wrong_credentials");
    } else if (obj.action == "libraryRequest") {
        var data = "";

        var library = createLibrary(obj.library);
        if (library) {
            data = library;
        }
        $("#library_target").html(data);

        return false;


        return getCurrentSlide();



    } else if (obj.action == "playlistRequestAll") {
        var data = "";

        var library = createPlaylists(obj.playlistAll);
        if (library) {
            data = library;
        }
        $("#playlists_target").html(data);
        return false;
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

        //create presentation object from reponse
        var path = parsePath(obj.presentationPath);

        console.warn("Actual action", path, obj);

        if (path.path_type == "title" && $('body').data("request") == 'playlist') {
            console.log("As playlist", path);
            $('body').data("request", null);
            var presentation = createPlaylists(obj.playlists);
        } else {
            console.log("As item", path);
            var presentation = createPresentation(obj.presentation);
        }

        //console.log(presentation);


        //in live mode trigger everzthing
        if ($('body').hasClass("live_mode")) {
            console.log("Live mode, filling and executing");
            $("#presentation_target").html(presentation);
            return selectPresentation(path.path_item);
        }

        //prisli mi data su mije?
        //console.log("data", $('body').data("request-title"), path.path_item.title);
        if ($('body').data("request-title") == path.path_item.title) {
            $('body').data("request-title", null);
            console.log("My request");
            $("#presentation_target").html(presentation);
            return selectPresentation(path.path_item);
        }

        //blind selection without open widows or regenrate my control
        console.log("Blind select");
        return selectPresentation(path.path_item, true); //ture means quiet


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
        $('body').data('received-index', null);
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
async function getCurrentSlide() {
    remoteWebSocket.send('{"action":"presentationSlideIndex"}');
}

async function getLibrary() {
    loader();
    remoteWebSocket.send('{"action":"libraryRequest"}');
}

async function getPlaylists() {
    loader();
    remoteWebSocket.send('{"action":"playlistRequestAll"}');
}

async function getPresentation(path) {
    loader();
    //
    $('body').data('request', path.path_type);
    $('body').data("request-title", path.path_item.title);
    console.warn("getPresentation", path.path_type, path.path_item.title);
    //
    if (path.path_type === "current") {
        //return getCurrentSlide();
        remoteWebSocket.send('{"action": "presentationCurrent", "presentationSlideQuality": "' + localStorage.getItem("_quality") + '"}');
    } else {
        remoteWebSocket.send('{"action": "presentationRequest","presentationPath": "' + path.path_item.path + '", "presentationSlideQuality": "' + localStorage.getItem("_quality") + '"}');
    }
}


function createPlaylists(playlists) {
    if (isNa(playlists)) {
        console.error("No playlists data received", playlists);
        return false;
    }
    playlists.sort();

    //console.log(library);
    //reset actual library
    global_playlists_list = new Array();
    global_playlists = new Array();
    //

    for (var i = 0; i <= playlists.length - 1; i++) {
        var playlist = playlists[i];
        //
        //var uuid = md5('playlist_' + playlist.playlistName);
        //store into global helper
        if (isNa(global_playlists_list[playlist.playlistLocation])) {
            global_playlists_list[playlist.playlistLocation] = playlist.playlistName;
        } else {
            console.error("Duplicate item", global_playlists_list[playlist.playlistLocation]);
        }

        var playlist_item = {
            'title': playlist.playlistName,
            'location': playlist.playlistLocation,
            'type': playlist.playlistType,
            'counter': 0,
            'items': []
        }


        for (var x = 0; x <= playlist.playlist.length - 1; x++) {
            var item = playlist.playlist[x];
            //

            var item_ = {
                'title': item.playlistItemName,
                'path': item.playlistItemLocation,
                'uuid': md5('item_' + item.playlistItemName),
                'type': item.playlistItemType,
            };

            playlist_item.items.push(item_);
            playlist_item.counter = playlist_item.counter + 1;
        }

        global_playlists.push(playlist_item);
    }

    console.log(global_playlists_list, global_playlists);

    var global_playlists_html = '';
    for (var i = 0; i <= global_playlists.length - 1; i++) {
        var playlist = global_playlists[i];
        // Add the library if required
        //console.log(playlist);
        var item_html = '';
        for (var x = 0; x <= playlist.items.length - 1; x++) {
            var item = playlist.items[x];
            item_html = item_html + `<div class="item playlist_item _trigger uuid_${item.uuid}" data-path="${item.title}" data-playlist="${item.path}"><div class="item_content"><div class="item_title">${item.title}</div><div class="item_group_title">${playlist.title}</div></div></div>`;
        }

        global_playlists_html = global_playlists_html + `<div class='group'><div class="group_title">${playlist.title}</div><div class="items">${item_html}</div></div>`;
    }
    return global_playlists_html;
}

function createLibrary(library) {

    if (isNa(library)) {
        console.error("No library data received", library);
        return false;
    }
    library.sort();

    //console.log(library);
    //reset actual library
    global_library_list = new Array();
    global_library = new Array();
    //
    var library_list_helper = new Array();
    var library_group_helper = new Array();
    //crate gourps
    for (var i = 0; i <= library.length - 1; i++) {
        var path = library[i];
        //
        var item = path.split('/').reverse();
        //
        var item_object = {
            'title': item[0].replace(/\.pro6/g, '').replace(/\.pro7/g, '').replace(/\.pro/g, ''),
            'file': item[0],
            'uuid': 'item_' + md5('item_' + item[0]),
            'library_title': item[1].replace(/\.pro6/g, '').replace(/\.pro7/g, '').replace(/\.pro/g, ''),
            'library_file': item[1],
            'library_uuid': 'library_' + md5('library_' + item[1]),
            'path': path
        };

        if (item_object.library_title == 'ProPresenter6') {
            item_object.library_title = 'Library';
        }

        //console.log(item_object);
        //store into global helper
        if (isNa(library_list_helper[item_object.uuid])) {
            library_list_helper[item_object.uuid] = item_object.path;
        } else {
            console.error("Duplicate item", library_list_helper[item_object.uuid]);
        }

        if (library_group_helper.indexOf(item_object.library_uuid) === -1) {
            library_group_helper.push(item_object.library_uuid);
            global_library.push({ 'title': item_object.library_title, 'uuid': item_object.library_uuid, 'counter': 1, 'items': [item_object] }); //Library name
        } else {
            global_library[library_group_helper.indexOf(item_object.library_uuid)]['items'].push(item_object);
            global_library[library_group_helper.indexOf(item_object.library_uuid)]['counter'] = global_library[library_group_helper.indexOf(item_object.library_uuid)]['counter'] + 1;
        }
    }

    //console.log(global_library);
    //return false;
    //global_library = groups;

    var library_html = '';
    for (var i = 0; i <= global_library.length - 1; i++) {
        var library_ = global_library[i];
        // Add the library if required
        //console.log(group);
        var item_html = '';
        for (var x = 0; x <= library_.items.length - 1; x++) {
            var item = library_.items[x];
            item_html = item_html + `<div class="presentation_item item library_item _trigger uuid_${item.uuid}" data-path="${item.title}"><div class="item_content"><div class="item_title">${item.title}</div><div class="item_group_title">${item.library_title}</div></div></div>`;
        }

        library_html = library_html + `<div class='group'><div class="library_title group_title">${library_.title}</div><div class="items">${item_html}</div></div>`;
    }

    //console.log(group_html);
    return library_html;
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
        var group_classes = new Array();
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
            var slide_classes = new Array();
            //console.log(slide);
            if (!isNa(slide.slideText)) {
                //console.log(slide.slideText.length, unescape(slide.slideText));
                slide.slideText = slide.slideText.trim();
                //
                slide.slideText = slide.slideText.replace(/^\x82+|\x82+$/gm, '').trim();
                //
            }

            if (isNa(slide.slideText)) {
                slide_classes.push('no_text');
            } else {
                if (slide.slideText.length > 500) {
                    slide_classes.push('long_text');
                }
            }

            if (!slide.slideEnabled) {
                slide_classes.push('disabled');
            }

            if (!isNa($('body').data('selected-index')) && parseInt($('body').data('selected-index'), 10) == slideIndex) {
                //slide_classes.push('selected');
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
                    slide_classes.push('bright_color');
                }
                var borderColor = `style="border-color:rgb(${slideColor});"`;

                var labelColor = `style="background-color:rgb(${slideColor});"`;
            }
            //
            var slideText = getSlideText(slide.slideText);
            //
            var item_html = `<div id="index_${slideIndex}" class="presentation_slide item ${slide_classes.join(' ')||''} _trigger" data-index="${slideIndex}"><div class="cont" ${borderColor}><div class="content"><div class="text">${slideText||''}</div><div class="thumb">${image||''}</div></div><div class="label_cont" ${labelColor}><div class="label"><span class="index">${slideIndex + 1}</span><span class="group_label">${groupName || ''}</span><span class="slide_label">${slide.slideLabel || ''}</span></div><div class="slide_actions"><div class="slide_action swap no-prop _do" data-do="_swap"><i class="fa-solid fa-image"></i></div></div></div></div></div>`;
            presentation_html.push(item_html);
            slideIndex = slideIndex + 1;
        }
    }
    if (presentation_html.length > 0) {
        var playlist = null;
        if (!isNa($("body").data('my-playlist'))) {
            playlist = `data-playlist="${$("body").data('my-playlist')}"`;
            group_classes.push('in_playlist');
            //
            console.warn("As playlist", $("body").data('my-playlist'));
            //
        }
        $("body").data('my-playlist', null);

        return `<div id="uuid_${uuid}" class="presentation padder ${group_classes.join(' ')||''}" data-path="${presentation.presentationName}" ${playlist || ''}>` + presentation_html.join('') + `</div>`;
    }
}

async function triggerPresentation(path) {
    console.log("triggerPresentation", path);
    return getPresentation(parsePath(path));
}


async function triggerSlide(path, index, as_playlist = false) {
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

    var uuid = path;

    if (!as_playlist) {
        var item = parsePath(path);
        path = item.path;
        uuid = item.uuid;
    }


    $("body").data('my-uuid', uuid);
    $("body").data('my-index', index);
    // Check if this is a playlist or library presentation
    if (as_playlist) {
        console.warn("As playlist");
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + path + '"}');
        // Check if we should follow ProPresenter
    } else {
        // Sent the request to ProPresenter
        remoteWebSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + path.replace(/\//g, "\\/") + '"}');
        // Check if we should follow ProPresenter
    }
}

async function triggerSlideNav(index) {
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

async function selectPresentation(item, quiet = false) {

    var uuid = item.uuid;
    var title = item.title;

    if (isNa(uuid)) {
        return console.warn("no uuid", uuid, title);
    }

    var target = ".uuid_" + uuid;
    console.log('selectPresentation', target, title);
    //
    $(".presentation_item").removeClass("selected");
    $(target).addClass("selected");
    $("body").addClass(["was_selected", "some_selected"]);

    if (quiet) {
        return false;
    }

    $('.active_presentation_title').html(title);
    return openPanel("_panel_control", function() { $("#automove_target").scrollTop(0); });

}


async function selectSlide(item, quiet = false) {

    var uuid = item.uuid;
    var title = item.title;
    var index = item.index;

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
    if (quiet) {
        return false;
    }

    return openPanel("_panel_control", autoMoveStep);

}

function parsePath(path, library_only = false) {
    if (isNa(path)) {
        console.log("parsePath", "invalid path", path);
        return false;
    }

    var item_object = {
        'path_type': null,
        'path_item': null
    }

    if (path == "current") {
        return { 'path_type': 'current', 'path_item': null };
    }
    //determine playlist path in pattern 0.0:0
    //   
    if (/^(?:\d\.*)*\d\:\d$/.test(path)) {
        //
        item_object.path_type = 'playlist';
        //
        var pathSplit = path.split(":").reverse();
        var song = pathSplit[0];

        var pathSplit = pathSplit[1].split(".");
        console.log("PARSE PATH AS PLAYLIST", pathSplit);

        var group = global_playlists;
        for (var x = 0; x <= pathSplit.length - 1; x++) {
            group = group[parseInt(pathSplit[x], 10)];
            //console.log(group);
        }

        item_object.path_item = group.items[song];
        //path = global_playlists_list[uuid];
        //var item = { 'title': 'item_file', 'filename': '', 'path': path, 'uuid': md5('playlist_item_' + 'item_file'), 'library': 'library' };
        console.warn("PARSE PATH AS PLAYLIST", path, global_playlists, item_object);
    } else {
        //
        item_object.path_type = 'path';
        //
        var pathSplit = path.split("/").reverse();

        if (pathSplit.length == 1) {
            //
            item_object.path_type = 'title';
            //  
        }
        var title = pathSplit[0].replace(/\.pro6/g, '').replace(/\.pro7/g, '').replace(/\.pro/g, ''); //prefix in createLibrary

        loop: for (var i = 0; i <= global_library.length - 1; i++) {
            var library = global_library[i];
            for (var x = 0; x <= library.items.length - 1; x++) {
                var item = library.items[x];
                if (item.title == title) {
                    //console.log(i, x, item);
                    item_object.path_item = item;
                    break loop;
                }
            }
        }

    }
    if (item_object.path_type == null || item_object.path_item == null) {
        console.error("No valid item in parsePath", item_object);
        return false;
    }
    return item_object;
}



function getSlideText(slideText) {
    if (slideText != null) {

        //
        slideText = slideText.trim();
        //
        slideText = slideText.replace(/^\x82+|\x82+$/gm, '');
        //
        slideText = slideText.replace(/^\r+|\r+$/gm, '');
        //add br
        slideText = slideText.replace(/\n|\x0B|\x0C|\u0085|\u2028|\u2029/g, "<br>");
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
        case "error":
            time = 10000;
            $("#status_message").addClass("red");
            $("#warr_message").html('<i class="fa-solid fa-triangle-exclamation"></i>' + ' ' + "Error: " + response);
            break;
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
            $("#warr_message").html('<i class="fa-solid fa-lock"></i>' + ' ' + "Interface is locked");
            break;
        case "live_mode":
            if (response == 'enabled') {
                $("#status_message").addClass("red");
            } else {
                $("#status_message").addClass("white");
            }
            $("#warr_message").html('<i class="fa-solid fa-lock"></i>' + ' ' + "Live mode " + response);
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