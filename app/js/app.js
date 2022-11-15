//app

$(document).on("click", "._open", async function(event) {
    event.preventDefault();
    if ($(this).hasClass("no-prop")) {
        event.stopPropagation();
    }
    var target = $(this).data("open");
    console.log(target);

    if (checkAttr(target)) {
        console.log("_open", "Undefined target");
        return false;
    }
    target = target.trim();

    return openPanel(target); //true slick true push_state
});




async function openPanel(target) {
    if (checkAttr(target)) {
        console.log("openPanel", "Undefined target");
        return false;
    }

    //remove all class with _ leading
    $("body").removeClass(function(index, css) {
        var replace = target + "\\d";
        var re = new RegExp(replace, "g");
        return (css.match(/\b\_\S+/g) || []).join(' ').replace(re, '').trim(); // removes anything that starts with "_"
    });

    //add target
    $("body").addClass(target);
}

function checkAttr(target) {
    if (target === undefined || target == '') {
        return true
    }
    return false;
}