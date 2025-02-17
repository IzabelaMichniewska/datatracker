var color = {
    'app': { fg: "#008", bg: "#eef" },
    'art': { fg: "#808", bg: "#fef" },
    'gen': { fg: "#080", bg: "#efe" },
    'int': { fg: "#088", bg: "#eff" },
    'ops': { fg: "#800", bg: "#fee" },
    'rai': { fg: "#808", bg: "#fef" },
    'rtg': { fg: "#880", bg: "#ffe" },
    'sec': { fg: "#488", bg: "#dff" },
    'tsv': { fg: "#484", bg: "#dfd" },
    'irtf': { fg: "#448", bg: "#ddf" },
    'break': { fg: "#000", bg: "#fff" },
}

var day = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
];

var padding = 2;
var border = 1;

//===========================================================================
function compute_swimlanes(items) {
    var start_map = items.map(function (el, i) {
        return { day: parseInt(el.day, 10), start_time: el.start_time, index: i };
    });

    start_map.sort(function (a, b) {
        if (a.day != b.day) { return (a.day - b.day); }
        return (a.start_time - b.start_time);
    });

    var end_map = items.map(function (el, i) {
        return { day: parseInt(el.day, 10), end_time: el.end_time, index: i };
    });

    end_map.sort(function (a, b) {
        if (a.day != b.day) { return (a.day - b.day); }
        return (a.end_time - b.end_time);
    });

    var si = 0; // start index
    var ei = 0; // end index
    var overlap = 0;
    var max_lanes = 0;
    var next_lane = [];

    var start_overlap = si;
    while (si < items.length) {
        var start_day_change = false;
        while (!start_day_change &&
            si < items.length &&
            start_map[si].start_time < end_map[ei].end_time) {
            overlap++;
            if (next_lane.length > 0) {
                items[start_map[si].index].lane = next_lane.shift();
            } else {
                items[start_map[si].index].lane = max_lanes;
                max_lanes++;
            }
            start_day_change = (si + 1 == items.length ||
                start_map[si].day != start_map[si + 1].day);
            si++;
        }
        var end_day_change = false;
        while (ei < items.length &&
            !end_day_change &&
            (start_day_change ||
                si == items.length ||
                start_map[si].start_time >= end_map[ei].end_time)) {
            next_lane.push(items[end_map[ei].index].lane);
            overlap--;
            end_day_change = (ei + 1 == items.length ||
                end_map[ei].day != end_map[ei + 1].day);
            ei++;
        }
        if (overlap == 0) {
            for (var i = start_overlap; i < si; i++) {
                items[start_map[i].index].lanes = max_lanes;
            }
            max_lanes = 0;
            next_lane = [];
            start_overlap = si;
        }
    }
}

//===========================================================================

function is_visible(filter_params) {
    // Returns a method to filter objects for visibility
    // Accepts show and hide filters. No longer accepts
    // '@<state>' to show sessions in a particular state (e.g., @bof).
    return function (item) {
        var filter_keywords = item.filter_keywords.split(',');
        return (!agenda_filter.keyword_match(filter_keywords, filter_params.hide) &&
            agenda_filter.keyword_match(filter_keywords, filter_params.show));
    }
}

//===========================================================================

window.draw_calendar = function (items, filter_params) {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;

    var visible_items = items;
    if (agenda_filter.filtering_is_enabled(filter_params)) {
        visible_items = visible_items.filter(is_visible(filter_params));
    }

    var start_day;
    var day_start;
    if (visible_items.length > 0) {
        start_day = visible_items[0].day;
        day_start = visible_items[0].start_time;
    } else {
        // fallback in case all items were filtered
        start_day = items[0].day;
        day_start = items[0].start_time;
    }
    var end_day = start_day;
    var day_end = 0;

    compute_swimlanes(visible_items);

    /* Find our boundaries */
    visible_items.forEach(function (item) {
        day_start = Math.min(day_start, item.start_time);
        day_end = Math.max(day_end, item.end_time);
        start_day = Math.min(start_day, item.day)
        end_day = Math.max(start_day, item.day)
    });

    var header_height = height * 0.05;

    var num_days = end_day - start_day + 1;
    var num_minutes = day_end - day_start;
    var day_width = width / num_days;
    var minute_height = (height - header_height) / num_minutes;

    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }

    var j = start_day;
    for (var i = 0; i < num_days; i++) {
        //-----------------------------------------------------------------
        // Draw weekday name
        //-----------------------------------------------------------------
        var e = document.createElement("div");

        e.style.border = "solid";
        e.style.borderWidth = border;

        e.style.background = "#2647a0";
        e.style.color = "#fff";
        e.style.borderColor = "#000 #fff";
        e.style.borderColor = "#2647a0 #2647a0 #000 #2647a0";

        e.style.display = "block";
        e.style.overflow = "hidden";
        e.style.position = "absolute";

        e.style.top = 0;
        e.style.left = i * day_width;
        e.style.width = day_width - 2 * (padding + border);
        e.style.height = header_height;

        e.style.margin = 0;
        e.style.padding = padding;
        e.style.fontFamily = "sans-serif";
        e.style.fontSize = header_height * 0.6;

        e.style.textAlign = "center";

        e.classList.add('agenda-weekview-day'); // for cypress tests

        var div = document.createElement("div");
        div.appendChild(document.createTextNode(day[((j + 1) % 7 + 7) % 7])); // js % is remainder, not modulus
        j++;
        e.appendChild(div);
        document.body.appendChild(e);

        //-----------------------------------------------------------------
        // Draw weekday column border
        //-----------------------------------------------------------------
        e = document.createElement("div");

        e.style.border = "solid";
        e.style.borderWidth = border;

        e.style.background = "#fff";
        e.style.color = "#000";
        e.style.borderColor = "#fff #000";

        e.style.display = "block";
        e.style.overflow = "hidden";
        e.style.position = "absolute";

        e.style.top = header_height;
        e.style.left = i * day_width;
        e.style.width = day_width - 2 * (padding + border);
        e.style.height = height -
            2 * (padding + border) - header_height;

        e.style.margin = 0;
        e.style.padding = padding;

        e.classList.add('agenda-weekview-column'); // for cypress tests

        document.body.appendChild(e);
    }

    //-----------------------------------------------------------------
    // Draw a block for each meeting
    //-----------------------------------------------------------------
    visible_items.forEach(function (item) {
        var sess_width = day_width / item.lanes;
        var sess_height = ((item.end_time - item.start_time) * minute_height) -
            2 * (padding + border);
        var day_left = ((item.day - start_day) * day_width);
        var sess_left = day_left + sess_width * item.lane;
        var sess_top = ((item.start_time - day_start) * minute_height) + header_height;

        sess_width = sess_width - 2 * (padding + border);

        var e = document.createElement("div");
        e.style.border = "solid";
        e.style.borderWidth = border;

        if (item.area && color[item.area]) {
            e.style.background = color[item.area].bg;
            e.style.color = color[item.area].fg;
            e.style.borderColor = color[item.area].fg;
        } else {
            if (item.area) {
                console.log("No color for " + item.area + ": using default");
            }
            e.style.background = "#e0e0e0";
            e.style.color = "#000000";
            e.style.borderColor = "#000000";
        }

        e.style.display = "block";
        e.style.overflow = "hidden";
        e.style.position = "absolute";
        e.style.top = sess_top;
        e.style.left = sess_left;
        e.style.width = sess_width;
        e.style.height = sess_height;
        e.style.margin = 0;
        e.style.padding = padding;
        e.style.fontFamily = "sans-serif";
        e.style.fontSize = "8pt";
        e.item = item;

        // for cypress tests
        e.classList.add('agenda-weekview-meeting');
        if (day_width !== sess_width) {
            e.classList.add('agenda-weekview-meeting-mini');
        }

        e.onmouseenter = function () {
            resize(e, sess_top, day_left,
                day_width - 2 * (padding + border),
                sess_height, true)
        };

        e.onmouseleave = function () { resize(e, sess_top, sess_left, sess_width, sess_height, false) };

        if (item.agenda) {
            e.onclick = function () { maximize(e) };
            e.style.cursor = "pointer";
        }

        var div = document.createElement("div");
        div.appendChild(document.createTextNode(item.time));
        div.appendChild(document.createElement("br"));

        var label = item.name;
        if (label.length === 0) {
            label = "Free Slot";
        }
        if (item.group && color[item.area]) {
            label = label + " (" + item.group + ")";
        }

        var bold = document.createElement("span");
        bold.appendChild(document.createTextNode(label));
        bold.style.fontWeight = "bold";
        div.appendChild(bold);

        if (item.room) {
            div.appendChild(document.createElement("br"));
            var italics = document.createElement("span");
            italics.appendChild(document.createTextNode(item.room));
            italics.style.fontStyle = "oblique";
            div.appendChild(italics);
        }

        e.appendChild(div);

        document.body.appendChild(e);
    });

    // Div to indicate rendering has occurred, for testing purposes.
    var elt = document.createElement('div');
    elt.id = 'wv-end';
    document.body.appendChild(elt);
}

//===========================================================================
// Note: if "to_fit" is true and the text won't fit in the dimensions
// provided, then the height parameter is ignored, and the item is resized to
// be tall enough to contain the entire contents

var animation_counter = 0;

function resize(div, top, left, width, height, to_fit) {
    var from_top = (div.style.top.replace("px", ""));
    var from_left = (div.style.left.replace("px", ""));
    var from_width = (div.style.width.replace("px", ""));
    var from_height = (div.style.height.replace("px", ""));

    // If we're fitting the height to the content, and there is overflow,
    // calculate the new (larger) height
    if (to_fit) {
        div.style.removeProperty("height");
        div.style.width = width;
        var clientHeight = div.clientHeight;
        div.style.height = from_height;
        div.style.width = from_width;
        if (clientHeight > height) {
            height = clientHeight;
        }
    }

    var animationId = "animation-" + (animation_counter++);

    // Move the element to the front
    div.style.zIndex = animation_counter;

    var style = document.createElement('style');
    style.textContent = "@keyframes " + animationId + " {" +
        "  from {" +
        "    top: " + from_top + ";" +
        "    left: " + from_left + ";" +
        "    width: " + from_width + ";" +
        "    height: " + from_height + ";" +
        "  }" +
        "  to {" +
        "    top: " + top + ";" +
        "    left: " + left + ";" +
        "    width: " + width + ";" +
        "    height: " + height + ";" +
        "  }" +
        "}";
    document.head.appendChild(style);

    var callback = function () {
        div.removeEventListener('animationend', callback);
        document.head.removeChild(style);

        div.style.top = top;
        div.style.left = left;
        div.style.width = width;
        div.style.height = height;

        if (div.callback) {
            div.callback();
            div.callback = undefined;
        }
    };

    div.addEventListener('animationend', callback, false);

    div.style.animationName = animationId;
    div.style.animationDuration = "0.25s";
    div.style.animationIterationCount = "1";
    div.style.animationFillMode = "forwards";
}

//===========================================================================

function finish_maximize(e) {
    if (!e.item.agenda) {
        console.log("Element has no agenda: " + JSON.stringify(e.item));
        return;
    }

    e.insertBefore(document.createElement("br"), e.firstChild);

    var i = document.createElement("i");
    i.classList.add('bi', 'bi-x-lg');
    i.style.cssFloat = "right";
    i.onclick = function () { minimize(e); };
    i.style.cursor = "pointer";
    e.insertBefore(i, e.firstChild);

    var h = document.createElement("span");
    h.appendChild(document.createTextNode(e.item.dayname));
    h.style.fontWeight = "bold";
    e.insertBefore(h, e.firstChild);
    e.style.fontSize = "10pt";

    var tmp = e.style.height;
    e.style.removeProperty("height");
    var used_height = e.clientHeight;
    e.style.height = tmp;

    var frame = document.createElement("iframe");
    frame.setAttribute("src", e.item.agenda);

    frame.style.position = "absolute";
    frame.style.left = 8;
    frame.style.width = e.clientWidth - 16 - 2 * (padding + border);
    frame.style.top = used_height + 8;
    frame.style.height = e.clientHeight - used_height - 16 - 2 * (padding + border);

    frame.style.background = "#fff";
    frame.style.overflow = "auto";
    frame.id = "agenda";

    frame.style.border = e.style.border;
    frame.style.borderWidth = border;
    frame.style.padding = padding;
    frame.style.borderColor = e.style.borderColor;

    e.appendChild(frame);

    e.keyHandler = function (event) {
        console.log(event.code);
        if (event.code === "Escape") {
            minimize(e);
        }
    };

    document.addEventListener('keydown', e.keyHandler, false);
}

//===========================================================================

function finish_minimize(e) {
    e.onmouseenter = e.oldmouseenter;
    e.onmouseleave = e.oldmouseleave;
    e.oldmouseenter = undefined;
    e.oldmouseleave = undefined;
    e.style.cursor = "pointer";
}

//===========================================================================

function maximize(e) {
    if (e.onmouseenter) {
        e.oldmouseenter = e.onmouseenter;
        e.oldmouseleave = e.onmouseleave;
        e.onmouseenter = undefined;
        e.onmouseleave = undefined;
        e.style.cursor = "auto";
        e.callback = function () { finish_maximize(e); }
        resize(e, 0, 0,
            document.body.clientWidth - 2 * (padding + border),
            document.body.clientHeight - 2 * (padding + border), false);
    }
}

//===========================================================================

function minimize(e) {
    var agenda = document.getElementById("agenda");
    if (agenda) {
        e.removeChild(agenda);
    }
    document.removeEventListener('keydown', e.keyHandler, false);
    e.callback = function () { finish_minimize(e); };
    e.oldmouseleave();
    e.removeChild(e.firstChild);
    e.removeChild(e.firstChild);
    e.removeChild(e.firstChild);
    e.style.fontSize = "8pt";
}

//===========================================================================
//
function get_first_item(items, type) {
    var earliest;
    for (var ii = 0; ii < items.length; ii++) {
        var this_item = items[ii];
        if (type && (this_item.type !== type)) {
            continue;
        }
        // Update earliest if we don't have an earliest item yet or this_item is earlier
        if (!earliest || (items[ii].utc_time < earliest.utc_time)) {
            earliest = items[ii];
        }
    }
    return earliest;
}

//===========================================================================
//
window.prepare_items = function (items, timezone_name) {
    function make_display_item(item) {
        return {
            name: item.name,
            group: item.group,
            area: item.area,
            room: item.room,
            agenda: item.agenda,
            key: item.key,
            type: item.type,
            filter_keywords: item.filter_keywords
        }
    };

    /* Ported from Django view, which had the following comment:
     *    Only show assignments from the traditional meeting "week" (Sat-Fri).
     *    We'll determine this using the saturday before the first scheduled regular session. */
    var first_session = get_first_item(items, 'Regular');
    if (!first_session) {
        first_session = get_first_item(items); // any type
    }
    var first_session_time = moment(first_session.utc_time)
        .utc();
    if (timezone_name) {
        first_session_time.tz(timezone_name); // mutates the moment
    }

    // Moment.js day() uses 0 == Sunday, 6 == Saturday
    days_since_saturday = first_session_time.day() - 6;
    if (days_since_saturday < 0) {
        days_since_saturday += 7;
    }
    saturday_before = first_session_time.clone()
        .startOf('day')
        .subtract(days_since_saturday, 'days');

    var display_items = [];
    for (var ii = 0; ii < items.length; ii++) {
        var this_item = items[ii];

        /* It's possible an event overlaps the moment of a daylight savings shift.
         * Calculate the end_moment in utc() time, which has no DST. Once we switch
         * to a time zone, end time minus start time may not equal duration. */
        var start_moment = moment(this_item.utc_time)
            .utc();
        var end_moment = start_moment.clone()
            .add(this_item.duration, 'seconds');
        if (timezone_name) {
            start_moment.tz(timezone_name);
            end_moment.tz(timezone_name);
        }
        // Avoid off-by-one day number calculations if a session ends at midnight
        var just_before_end_moment = end_moment.clone()
            .subtract(1, 'millisecond');

        var start_day = start_moment.diff(saturday_before, 'days') - 1; // shift so sunday = 0
        var end_day = just_before_end_moment.diff(saturday_before, 'days') - 1; // shift so sunday = 0

        // Generate display items - create multiple if item ends on different day than starts
        for (var day = start_day; day <= end_day; day++) {
            var display_item = make_display_item(this_item);
            display_item.day = day;
            if (day === start_day) {
                // First day of session - compute start time
                display_item.start_time = start_moment.diff(
                    start_moment.clone()
                    .startOf('day'),
                    'minutes'
                );
            } else {
                // Not first day, start at midnight
                display_item.start_time = 0;
                display_item.name += " - continued";
            }
            if (day === end_day) {
                // Last day of session - compute end time
                display_item.end_time = end_moment.diff(
                    just_before_end_moment.clone()
                    .startOf('day'),
                    'minutes'
                );
            } else {
                /* Not last day, use full day. Calculate this on the fly to account for
                 * daylight savings shifts, when a calendar day is not 24*60 minutes long. */
                display_item.end_time = just_before_end_moment.clone()
                    .endOf('day')
                    .diff(
                        just_before_end_moment.clone()
                        .startOf('day'),
                        'minutes'
                    );
            }

            display_item.time = start_moment.format('HHmm') + '-' + end_moment.format('HHmm');
            display_item.dayname = start_moment.format('dddd, ')
                .toUpperCase() +
                start_moment.format('MMMM D, Y');
            display_items.push(display_item);
        }
    }
    return display_items;
}