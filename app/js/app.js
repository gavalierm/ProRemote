//app
const LOGGING = true;

$(document).on("click", "._do", async function(event) {
    event.preventDefault();
    if ($(this).hasClass("no-prop")) {
        event.stopPropagation();
    }
    var target = $(this).data("do") + '';
    //console.log(target);

    if (isNa(target)) {
      if(LOGGING) console.log("_do", "Undefined target");
        return false;
    }
    target = target.trim();

    return triggerDo(target, this);
});

$(document).on("click", "._open", async function(event) {
    event.preventDefault();
    if ($(this).hasClass("no-prop")) {
        event.stopPropagation();
    }
    var target = $(this).data("open") + '';
    //console.log(target);

    if (isNa(target)) {
      if(LOGGING) console.log("_open", "Undefined target");
        return false;
    }
    target = target.trim();

    return openPanel(target); //true slick true push_state
});

$(document).on("click", "._trigger", async function(event) {
    event.preventDefault();
    if ($(this).hasClass("no-prop")) {
        event.stopPropagation();
    }
    var load = $(this).data("load");
    var path = $(this).data("path");
    var index = $(this).data("index");
    var type = $(this).data("type");

    //console.log(load, path, index, playlist);

    if (isNa(load)) {
        //console.info("_trigger", "Undefined load");
    }
    if (isNa(index)) {
        //console.info("_trigger", "Undefined index");
    }
    if (isNa(path)) {
        //console.info("_trigger", "Undefined path");
    }
    if (isNa(type)) {
        //console.info("_trigger", "Undefined playlist");
    }

    if (!isNa(load)) {
        //console.log("Triggering load", load);
        switch (load) {
            case "_library":
                return getLibrary();
            case "_playlists":
                return getPlaylists();
        }
        return false;
    }

    if (!isNa(index)) {
        if (index == "_prev" || index == "_clear" || index == "_next") {
            //console.log("Triggering nav", path, index);
            return triggerSlideNav(index);
        }
        if (!isNa(path)) {
            //console.log("Triggering slide with defined path", path, index);
            return triggerSlide(path, index);
        }

        path = $(this).parents('.presentation').data("path");
        if (isNa(path)) {
            return showWarr('No path in trigger', path + ', ' + index);
        }
        //
        if (type == "playlist") {
          if(LOGGING) console.log("Triggering slide with parent playlist", path, index);
        } else {
          if(LOGGING) console.log("Triggering slide with parent path", path, index);
        }

        return triggerSlide(path, index);
    }
    if (!isNa(path)) {
        return triggerPresentation(path);
    }
    return showWarr('No path or index in trigger', path + ', ' + index);
});



//global array for back stepping
var global_back_steps = new Array('_panel_library');

async function openPanel(target, callback = null) {
    if (isNa(target)) {
        //console.log("openPanel", "Undefined target");
        return false;
    }
    //
    if (target == "_panel_back") {
        var _target = '_panel_library';
        if (global_back_steps.length > 1) {
            _target = global_back_steps[(global_back_steps.length - 2)];
            global_back_steps.pop();
        }
        return openPanel(_target, callback);
    } else if (target == "_panel_close") {
        return openPanel('_panel_library', callback);
    }
    //
    //remove all class with _ leading
    $("body").removeClass(function(index, css) {
        var replace = target + "\\d";
        var re = new RegExp(replace, "g");
        return (css.match(/\b\_\S+/g) || []).join(' ').replace(re, '').trim(); // removes anything that starts with "_"
    });

    //add target
    $("body").addClass(target);
    if (global_back_steps.length && global_back_steps[global_back_steps.length - 1] !== target) {
        global_back_steps.push(target);
    }
    if (global_back_steps.length > 3) {
        global_back_steps.shift();
    }
    //console.log(global_back_steps);
    if (callback) {
        return callback();
    }
}


function triggerDo(target, element) {
    //console.log("triggerDo", target, element);

    switch (target) {
        case "_safe_mode":
            if ($('body').hasClass("safe_mode")) {
                $('body').removeClass("safe_mode");
                return showWarr("safe_mode", 'disabled');
            } else {
                $('body').addClass("safe_mode");
                return showWarr("safe_mode", 'enabled');
            }
        case "_follow_mode":
            if ($('body').hasClass("follow_mode")) {
                $('body').removeClass("follow_mode");
                return showWarr("follow_mode", 'disabled');
            } else {
                $('body').addClass("follow_mode");
                return showWarr("follow_mode", 'enabled');
            }
        case "_clear_loader":
            return loader(true); //true mean s clear
        case "_store_connection":
            return storeConnection(true); //true means auto connect
        case "_store_filters":
            return storeFilters(); //true means auto connect
        case "_fill_search":
            //console.log($(element).data('fill'));
            $('#search input').val($(element).data('fill')).trigger("input");
            return false;
        case "_swap":
            $(element).parents(".item").first().toggleClass("show_thumb");
            return false;
    }
}

function isNa(target) {
    if (target === undefined || target === 'undefined' || target === '' || target === null) {
        return true
    }
    return false;
}