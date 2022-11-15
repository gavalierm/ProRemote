//app

$(document).on("click", "._open", async function(event) {
    event.preventDefault();
    if ($(this).hasClass("no-prop")) {
        event.stopPropagation();
    }
    var target = $(this).data("open") + '';
    //console.log(target);

    if (isNa(target)) {
        console.log("_open", "Undefined target");
        return false;
    }
    target = target.trim();

    return openPanel(target); //true slick true push_state
});

$(document).on("click", "._select", async function(event) {
    event.preventDefault();
    if ($(this).hasClass("no-prop")) {
        event.stopPropagation();
    }
    var uuid = $(this).data("id") + '';
    //console.log(uuid);

    if (isNa(uuid)) {
        console.log("_select", "Undefined uuid");
        return false;
    }
    uuid = uuid.trim();

    return selectItem(uuid); //true slick true push_state
});

$(document).on("click", "._trigger", async function(event) {
    event.preventDefault();
    if ($(this).hasClass("no-prop")) {
        event.stopPropagation();
    }
    var index = $(this).data("index") + '';
    console.log(index);

    if (isNa(index)) {
        console.log("_trigger", "Undefined index");
        return false;
    }
    index = index.trim();

    return triggerSlide(index, this); //true slick true push_state
});



//global array for back stepping
var global_back_steps = new Array('_panel_library');

async function openPanel(target) {
    if (isNa(target)) {
        console.log("openPanel", "Undefined target");
        return false;
    }
    //
    if (target == "_panel_back") {
        var _target = '_panel_library';
        if (global_back_steps.length > 1) {
            _target = global_back_steps[(global_back_steps.length - 2)];
            global_back_steps.pop();
        }
        return openPanel(_target);
    } else if (target == "_panel_close") {
        return openPanel('_panel_library');
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
}

function isNa(target) {
    if (target === undefined || target == '' || target == null) {
        return true
    }
    return false;
}