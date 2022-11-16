var typing = null;
$(document).ready(function() {
    $(".search input").on("input", function(e) {
        e.preventDefault();
        typing = window.setTimeout(function() {
            clearTimeout(typing);
            typing = null
        }, 100);
        return filterItems($(this).val().trim());
    });
    $("#panel_library .panel_wrapper").on("scroll", function(e) {
        //console.log("scrolling",$(this));    
        e.preventDefault();
        //if( $("body").hasClass("_songs") ){
        if (typing == null) {
            return clearFocus();
        }
        //}
    });
});
//console.log(findObject(obj, 'id', null));
async function filterItems(query = null) {
    $("#panel_library .gorup").removeClass('hidden');
    $("#panel_library .group_title").removeClass('hidden');
    $("#panel_library .item").removeClass('hidden');
    //
    if (query == null) {
        return false;
    }
    //
    query = query.trim().toLowerCase();
    //
    if (query == "" || query == "\n" || query == "\r" || query == "\t") {
        return false;
    }
    //console.log( "Search Song trigger", query);
    $("#panel_library .panel_content").scrollTop(0);
    //
    var cached = global_library;

    if (!cached) {
        console.log("No cached", query);
        return showWarr("no global_library");
    }
    //console.log( cached );
    $("#panel_library .gorup").addClass('hidden');
    $("#panel_library .group_title").addClass('hidden');
    $("#panel_library .item").addClass('hidden');
    //

    if (query == 'last20' || query == 'bottom20' || query == 'nehrane' || query == 'nehrané' || query == 'zabudnute' || query == 'zabudnuté') {
        var list = cached;
        list.sort((a, b) => (a.trend_counter < b.trend_counter) ? 1 : (a.trend_counter === b.trend_counter) ? ((a.id < b.id) ? 1 : -1) : -1);
        list.reverse();
        //console.log(list);
        for (var i = 0; i <= list.length - 1; i++) {
            if (list[i].trend_counter > 0) {
                //firest no trend break the loop
                break;
            }
            if (i > 20) {
                break;
            }
            $("#panel_library  .uuid_" + list[i].id).removeClass('hidden').prevAll('.first_letter').first().removeClass('hidden');
        }
        return false;
    }

    var mark = false;
    for (var i = 0; i <= cached.length - 1; i++) {
        mark = false;

        if (checkSearch(cached[i], query)) {
            console.log(cached[i]);
            mark = true;
        }

        if (mark) {
            $("#panel_library  .uuid_" + cached[i].uuid).removeClass('hidden').prevAll('.group_title').first().removeClass('hidden').prevAll('.group').first().removeClass('hidden');
        }
    }
}
async function clearFocus() {
    var focus = $(".search input");
    if (focus.is(':focus')) {
        console.log("search clear");
        focus.blur();
    }
}

function checkSearch(item, query_string) {
    if (query_string == "" || !query_string) {
        return false;
    }
    //log( query_string );
    query_string = query_string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\w\s]/gi, '');

    var case_1 = '';
    var case_2 = '';

    if (item.title) {
        case_1 = item.title.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }
    if (item.library.title) {
        case_2 = item.library.title.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    var expression = new RegExp(query_string, "i");
    if (case_1.search(expression) != -1 || case_2.search(expression) != -1) {
        return true;
    }
    return false;
}