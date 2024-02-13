async function autoMoveStep(target = null, callback = null) {

    if (LOGGING) console.log("AutoStep");
    if (!$("body").hasClass("_panel_control") || !isFollow()) {
        if (LOGGING) console.log("AutoStep", "pausing");
        return pauseAutoMove();
    }

    if (target == null) {
        target = $("#automove_target .presentation_slide.selected").attr('id');
        if (target) {
            target = "#" + target;
        }
    }

    var autoMoveTarget = target;

    if (!autoMoveTarget) {
        if (LOGGING) console.log("AutoStep", "no target", autoMoveTarget);
        return false;
    }

    if (LOGGING) console.log("auto move target", autoMoveTarget);

    //$('#automove_target .chart_sections .section').addClass("automove_inactive_pos");
    //$(autoMoveTarget).removeClass("automove_inactive_pos");
    //if( automove_log ){ //console.log("autoMove", autoMove_songs_index, autoMove_sections_index);}
    $('#automove_target').stop();

    $('#automove_target').scrollDivToElement(autoMoveTarget, 5, callback); //custom func see bellow
    return false;
}

async function pauseAutoMove() {
    if (LOGGING) console.log("pauseAutoMove");
    return false;
}







var autoMove_scroll_speed = 300;
var autoMove_scroll_offset = 20;
//JQ plugin
//small jquery plugin to scroll overfloed element
$.fn.scrollDivToElement = function (childSel, offset = 0, callback = false) {
    ////console.log("scrollDivToElement", childSel);
    //return;
    if (!this.length) return this;

    return this.each(function () {
        let parentEl = $(this);
        let childEl = parentEl.find(childSel);
        ////console.log("childEl",childEl);
        if (!parseInt(childEl.length)) {
            if (callback) {
                return callback();
            }
            return false;
        }
        offset = Math.floor(parentEl.scrollTop() - parentEl.offset().top + childEl.offset().top - offset)

        if (childEl.length > 0) {
            parentEl.animate({
                scrollTop: (offset - autoMove_scroll_offset)
            }, autoMove_scroll_speed, 'linear', function () {
                autoMove_scroll_speed = 300;
                $('html, body').off("scroll mousedown mouseup click wheel DOMMouseScroll mousewheel keyup touchmove");
                parentEl.off("scroll mousedown mouseup click wheel DOMMouseScroll mousewheel keyup touchmove");
                if (callback) {
                    return callback();
                }
            });
            //parentEl.scrollTop(parentEl.scrollTop() - parentEl.offset().top + childEl.offset().top - offset );
        }
    });
};