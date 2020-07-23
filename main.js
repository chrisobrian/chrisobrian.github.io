const svgH = 694;
const svgW = 903;

var svg, main, acc, newFixtDiv, selectedFixtDiv;
var minPrice = 0, maxPrice = 0;

var idxCounter = 0;
var dragline = null;
var draglineOver = null;
var selected = null;
var fixtures = {};

/************************************/
/* Pricing & Device Information     */
/************************************/

prices = {
    'dimmer'                : [78, 78],
    'dimmer-pro'            : [105, 105],
    'dimmer-elv'            : [145, 145],
    'fan-speed-controller'  : [86, 86],
    'neutral-switch'        : [85, 85],
    'switch-pro'            : [96, 96],
    'lamp-dimmer'           : [69, 69],

    'pico-remote'           : [21, 21],
    'pico-remote-2-but'     : [25, 56],
    'pico-remote-4-but'     : [25, 39],
    'pico-remote-fan'       : [42, 42],
    'pico-remote-audio'     : [49, 49],

    'pico-scene-2-but'      : [56, 56],
    'pico-scene-4-but'      : [56, 56],

    'pico-occupancy-sensor' : [68, 68],
    'thermostat'            : [355, 355],

    // Includes:
    'none'                  : [0, 0],
    'acc-wallplate'         : [8.6, 8.6],
    'acc-carclip'           : [9, 9],
    'acc-pedestal-1'        : [15, 25],
    'acc-pedestal-2'        : [30, 40],
    'acc-pedestal-3'        : [100, 100]
};

function newDevice(id, location) {
    return {
        'id'        : id,
        'name'      : '',
        'type'      : 'dimmer',
        'acc'       : 'none',
        'shape'     : 'rect',
        'loc'       : location,
        'price'     : [0,0],
        'controls'  : []
    };
}

/************************************/
/* Main Functions                   */
/************************************/

/** Selects a fixture with given id and shows select window if location provided. */
function selectFixt(id, loc=null) {

    // Deselect old fixture if need be:
    if (selected !== null) deselectFixt();

    selected = d3.select("svg #" + id);
    selected.classed('selected', true);
    // selected.classed('move', false);
    
    // Populate info window with necessary info:
    loadDeviceDetails();
}

/** Deselects selected fixture and saves info: */
function deselectFixt() {
    if (selected === null) return;

    let loc = selected.node().getBBox();

    selected.classed('selected', false);
    
    fixtures[selected.attr('id')].loc[0] = loc.x + loc.width / 2;
    fixtures[selected.attr('id')].loc[1] = loc.y + loc.height / 2;

    newFixtDiv.style.display = 'none';
    selectedFixtDiv.style.display = 'none';

    selected = null;
}

function onPageLoad() {

    // Capture necessary keystrokes:
    document.onkeydown = function(e) {
        e = e || window.event;
        if (/^(37|38|39|40|8|13|27|73)$/.test(String(e.keyCode)) 
            && document.activeElement.tagName === 'BODY') {
            // Arrow keys and backspace!
            onKeyStroke(e.keyCode);
            return false;
        }
        return true;
    };


    // Identifiers:
    svg = d3.select('svg#main');
    newFixtDiv = document.getElementById('new-fixture-window');
    selectedFixtDiv = document.getElementById('selected-fixture-window');
    acc = d3.select("#lutron");


    // Onclick event for adding new lutron fixtures:
    svg.on("mousedown", function() {
        if (d3.event.target.id != "main") return;

        if (selected !== null && d3.event.target.id != selected.attr('id')) {
            // Another device is selected and I want to deselect:
            deselectFixt();
        }

        else {
            // Otherwise, add a new fixture:
            let loc = d3.mouse(this);
            let newId = 'lutron-' + idxCounter++;

            let n = acc.append("rect")
                .attr('id', newId)
                .attr('class', 'lutron init')
                .attr('x', loc[0] - 8)
                .attr('y', loc[1] - 8)
                .attr('width', 16)
                .attr('height', 16)
                .attr('draggable', 'true')
                .on('click', fixtureClick)
                .on('mouseover', onLutronMouseover)
                .on('mouseout', onLutronMouseout)
                .on('mousedown', beginDragline)
                .on('mousemove', moveDragline)
                .on('mouseup', onControllerMouseup);

            // Create data object:
            fixtures[newId] = newDevice(newId, loc);
            
            // Select new fixture & show "new fixture" dialog:
            selectFixt(newId, loc);
        }
    });

    // For dragging control signal line!
    svg.on('mousemove', moveDragline)
        .on('mouseup', function() {
            if (dragline === null) return;

            // Clean up dragline:
            d3.selectAll("svg #fixtures > *")
                .attr("opacity", 1);

            dragline.remove();
            dragline = null;

            //selectedFixtDiv.style.display = 'block';
        });


    // When user is dragging a "control" line from lutron device to fixture/circuit:
    svg.selectAll("svg #fixtures *")
        .on("mouseover", onDraglineMouseover)
        .on("mouseout", onDraglineMouseout)
        .on("mouseup", endDragline);

    // Add regular event listeners:
    document.getElementById('selected-fixture-form').addEventListener('submit', saveDeviceDetails);
    document.getElementById('save-button').addEventListener('click', saveSketchFile);
    document.getElementById('load-button').addEventListener('click', function() {
        let input = document.getElementById('load-input');
        input.click();
    });
    document.getElementById('load-input').addEventListener('change', loadSketchFile);
}


/** Capture user keystrokes and execute necessary actions:
 *  - Arrow keys move a device
 *  - Backspace deletes device 
 *  - Esc key deselects device. */
function onKeyStroke(code) {

    if (selected === null) return;

    selectedFixtDiv.style.display = 'none';
    
    // Arrow keys for movement:
    if (code == 37) {
        if (selected.node().tagName == 'rect')
            selected.attr('x', Number(selected.attr('x')) - 1 );
        else
            selected.attr('cx', Number(selected.attr('cx')) - 1 );
    }
    else if (code == 39) {
        // selected.classed('move', true);
        if (selected.node().tagName == 'rect')
            selected.attr('x', Number(selected.attr('x')) + 1 );
        else
            selected.attr('cx', Number(selected.attr('cx')) + 1 );
    }
    else if (code == 38) {
        if (selected.node().tagName == 'rect')
            selected.attr('y', Number(selected.attr('y')) - 1 );
        else
            selected.attr('cy', Number(selected.attr('cy')) - 1 );
    }
    else if (code == 40) {
        if (selected.node().tagName == 'rect')
            selected.attr('y', Number(selected.attr('y')) + 1 );
        else
            selected.attr('cy', Number(selected.attr('cy')) + 1 );
    }

    else if (code == 8 && document.activeElement.tagName == 'BODY') {
        // Backspace key
        selected.remove();

        let fixt = fixtures[selected.attr('id')];

        fixt.controls.forEach(e => {
            d3.select('#' + e).classed('controlled', false);
        });

        minPrice -= fixt.price[0];
        maxPrice -= fixt.price[1];

        updatePriceEst();

        delete fixtures[selected.attr('id')];
        selected = null;
    }

    else if (code == 27) {
        // Escape key
        if (dragline !== null)
            dragline.remove();
        dragline = null;

        deselectFixt();
    }

    else if (code == 73) {
        // "i" Key (for info)

        if (selectedFixtDiv.style.display == 'block') {
            selectedFixtDiv.style.display = 'none';
        }
        else {

            // Need to relocate info window
            
            let loc = [
                Number(selected.attr('x') || selected.attr('cx')), 
                Number(selected.attr('y') || selected.attr('cy'))
            ];

            selectedFixtDiv.style.bottom = (svgH-loc[1] + 8) + 'px';
            if (loc[0] < 580) {
                selectedFixtDiv.style.left = (loc[0] + 8) + 'px';
                selectedFixtDiv.style.right = 'initial';
            }
            else {
                selectedFixtDiv.style.right = (svgW - (loc[0] - 8)) + 'px';
                selectedFixtDiv.style.left = 'initial';
            }


            if (loc[1] < 250) {
                selectedFixtDiv.style.top = (loc[1] + 8) + 'px';
                selectedFixtDiv.style.bottom = 'initial';
            }
            else {
                selectedFixtDiv.style.bottom = (svgH-loc[1] + 8) + 'px';
                selectedFixtDiv.style.top = 'initial';
            }

            // Populate content with correct info & show!
            selectedFixtDiv.style.display = 'block';
        }
    }
}


/************************************/
/* SVG Event Handlers               */
/************************************/

var circuitHover = null;


/** Begins dragline process */
function beginDragline() {

    if (selected === null) return;

    let srcbox = this.getBBox();
    let loc = d3.mouse(this);

    // Only allowed to drag currently selected lutron device
    if(event.target.id !== selected.attr('id')) return;

    dragline = acc.append('line')
        .attr('id', 'dragline')
        .attr('x1', srcbox.x + srcbox.width / 2)
        .attr('y1', srcbox.y + srcbox.height / 2)
        .attr('x2', loc[0])
        .attr('y2', loc[1]);

    selectedFixtDiv.style.display = 'none';
}


/** Updates positioning for dragline */
function moveDragline() {
    if (dragline === null 
        || selected === null) return;


    let loc = d3.mouse(this);
    dragline
        .attr('x2', loc[0])
        .attr('y2', loc[1]);
}

/** Hover event when "dragging" a dragline over a circuit, fixture or device: */
function onDraglineMouseover() {

    // If no dragline is present:
    if (dragline === null) return;

    let t = d3.select(this);
    circuitHover = this;
    // t.classed('dragline-hover', true);

    if (selected.classed('remote') && t.classed('lutron')) {
        // Hovering over a lutron device; only highlight if dragging from remote!
        d3.selectAll("svg #lutron > *")
        .attr("opacity", 0.5);

        selected.attr('opacity', 1);
        t.attr('opacity', 1);
    }
    else if (!selected.classed('remote') && !t.classed('lutron')){
        // Otherwise, hovering over a fixture while a controller
        d3.selectAll("svg #fixtures > *")
        .attr("opacity", 0.5);

        if (this.parentElement.id != 'fixtures')
            d3.select(this.parentElement).attr('opacity', 1);
        else 
            t.attr('opacity', 1);
    }
}

function onDraglineMousemove() {
    let loc = d3.mouse(this);

    dragline
        .attr('x2', loc[0])
        .attr('y2', loc[1]);
}

/** Hover event when "dragging" a dragline LEAVES a circuit or fixture */
function onDraglineMouseout() {

    // If no dragline is present:
    if (dragline === null) return;

    let t = d3.select(this);
    t.classed('dragline-hover', true);

    d3.selectAll("svg #fixtures > *")
        .attr("opacity", 1);

    circuitHover = null;
}


/** When user releases mouse WHILE hovering on a circuit/fixture */
function endDragline(el) {

    if(selected === null || dragline === null) return;

    el = el || this;
    console.log(el);

    // Clean up dragline:
    d3.selectAll("svg #fixtures > *")
        .attr("opacity", 1);

    dragline.remove();
    dragline = null;

    if (el.parentElement.id == 'lutron' && selected.classed('remote')) {
        // A remote is trying to control a lutron fixture!
        if (fixtures[el.id].shape != 'rect') return;

        fixtures[selected.attr('id')].controls.push(el.id);
        d3.select(el).classed('remote-controlled', true);
        selected.classed('init', false);
    }

    // Add this circuit/fixture to controller's domain!
    else if (el.parentElement.id != 'fixtures' && !selected.classed('remote')) {
        // This means fixture is in a circuit (or is a circuit)
        let p = el.parentElement;

        if (d3.select(p).classed('controlled')) {
            alert("There is already a Lutron device controlling this circuit!");
            return;
        }

        fixtures[selected.attr('id')].controls.push(p.id);
        d3.select(p).classed('controlled', true);
        selected.classed('init', false);
    }
    else if (!selected.classed('remote')) {
        // Fixture is standalone.
        if (d3.select(el).classed('controlled')) {
            alert("There is already a Lutron device controlling this fixture!");
            return;
        }

        fixtures[selected.attr('id')].controls.push(el.id);
        d3.select(el).classed('controlled', true);
        selected.classed('init', false);
    }
}


/** Onclick event for selecting a fixture: */
function fixtureClick(id=null) {
    d3.event.preventDefault();
    if (id === null) id = d3.event.target.id;

    if(selected !== null && d3.event.shiftKey) {
        let t = d3.select(this);
        let loc = d3.mouse(this);

        // Only allowed to dragline currently selected lutron device
        if(selected.attr('id') === null || id !== selected.attr('id')) return;

        dragline = acc.append('line')
            .attr('id', 'dragline')
            .attr('x1', Number(t.attr('x')) + 5)
            .attr('y1', Number(t.attr('y')) + 5)
            .attr('x2', loc[0])
            .attr('y2', loc[1]);
    }
    else {
        selectFixt(id, d3.mouse(this));
    }
}


/** Hover handler for lutron devices */
function onLutronMouseover(el) {

    el = el || this;
    
    d3.selectAll('svg #fixtures > *, svg #lutron > *')
        .attr('opacity', 0.2);

    let device = d3.select(el);
    let srcbox = device.node().getBBox();

    let lines = svg.append('g')
        .attr('id', 'hoverlines');

    device.attr('opacity', 1);

    console.log(fixtures[el.id].controls);

    fixtures[el.id].controls.forEach( e => {

        let tgt = d3.select('#' + e);
        tgt.attr('opacity', 1);

        if (tgt.node().tagName == 'g') {
            // This is a circuit!
            
            svg.selectAll('#' + e + ' circle, #' + e + ' rect').each( function() {
                let tgtbox = this.getBBox();

                lines.append('line')
                    .attr('x1', srcbox.x + srcbox.width / 2)
                    .attr('x2', tgtbox.x + tgtbox.width / 2)
                    .attr('y1', srcbox.y + srcbox.height / 2)
                    .attr('y2', tgtbox.y + tgtbox.height / 2)
                    .attr('class', 'dragline');
            });
        }
        else {
            // This is a standalone fixture.
            let tgtbox = tgt.node().getBBox();

            lines.append('line')
                .attr('x1', srcbox.x + srcbox.width / 2)
                .attr('x2', tgtbox.x + tgtbox.width / 2)
                .attr('y1', srcbox.y + srcbox.height / 2)
                .attr('y2', tgtbox.y + tgtbox.height / 2)
                .attr('class', 'dragline');
            }
    });
}


/** Hover handler for lutron devices */
function onLutronMouseout() {
    let lines = d3.select("svg #hoverlines");

    if (lines !== null) lines.remove();

    d3.selectAll('svg #fixtures > *, svg #lutron > *')
        .attr('opacity', 1);
}

/** When mouseup on a lutron remote: */
function onRemoteMouseup() {

    // Don't change anything.
    d3.selectAll("svg #fixtures > *")
        .attr("opacity", 1);

    if (dragline !== null) {
        dragline.remove();
        dragline = null;
    }
}

/** When mouseup on lutron controller */
function onControllerMouseup() {

    d3.selectAll("svg #fixtures > *")
    .attr("opacity", 1);

    // If dragging from remote:
    endDragline(this);
}

/************************************/
/* Backend Functions                */
/************************************/

/** populates device details window when selected  */
function loadDeviceDetails() {
    // ....

    // Update basic info in fixture data object:
    let nameInp = document.getElementById('device-name');
    nameInp.value = fixtures[selected.attr('id')].name;

    let select = document.getElementById('device-input');
    select.value = fixtures[selected.attr('id')].type;

    let selectInc = document.getElementById('includes-input');
    selectInc.value = fixtures[selected.attr('id')].acc;
}

/** Executed on submit of "selected fixture" form */
function saveDeviceDetails(e) {
    e = e || window.event;
    e.preventDefault();

    // Update name info in fixture data object:
    let nameInp = document.getElementById('device-name');
    fixtures[selected.attr('id')].name = nameInp.value;
    
    // Remove old device pricing from estimate
    minPrice -= fixtures[selected.attr('id')].price[0];
    maxPrice -= fixtures[selected.attr('id')].price[1];

    // Device Type & Pricing
    let select = document.getElementById('device-input');
    let newPrice = prices[select.options[select.selectedIndex].value];
    fixtures[selected.attr('id')].type = select.options[select.selectedIndex].value;

    // Includes Type & Pricing
    let selectInc = document.getElementById('includes-input');
    let includePrice = prices[selectInc.options[selectInc.selectedIndex].value];
    fixtures[selected.attr('id')].acc = selectInc.options[selectInc.selectedIndex].value;

    // Update estimate with new pricing:
    fixtures[selected.attr('id')].price = [
        newPrice[0] + includePrice[0],
        newPrice[1] + includePrice[1]
    ];
    minPrice += fixtures[selected.attr('id')].price[0];
    maxPrice += fixtures[selected.attr('id')].price[1];
    updatePriceEst();

    // Update device shape:
    let isRemote = /^pico-/.test(select.options[select.selectedIndex].value);

    if (isRemote && fixtures[selected.attr('id')].shape != 'circle') {
        // Need to make a circle!
        let next = acc.append('circle')
            .attr('id', selected.attr('id'))
            .attr('class', selected.attr('class') + ' remote')
            .attr('cx', Number(selected.attr('x')) + 8)
            .attr('cy', Number(selected.attr('y')) + 8)
            .attr('r', 8)
            .attr('draggable', 'true')
            .on('click', fixtureClick)
            .on('mouseover', onLutronMouseover)
            .on('mouseout', onLutronMouseout)
            .on('mousedown', beginDragline)
            .on('mousemove', moveDragline)
            .on('mouseup', onRemoteMouseup);

        fixtures[selected.attr('id')].shape = 'circle';

        selected.remove();
        selected = next;
    }
    else if (!isRemote && fixtures[selected.attr('id')].shape != 'rect') {
        // Need to make a rect!
        let next = acc.append('rect')
            .attr('id', selected.attr('id'))
            .attr('class', selected.attr('class'))
            .attr('x', Number(selected.attr('cx')) - 8)
            .attr('y', Number(selected.attr('cy')) - 8)
            .attr('width', 16)
            .attr('height', 16)
            .attr('draggable', 'true')
            .on('click', fixtureClick)
            .on('mouseover', onLutronMouseover)
            .on('mouseout', onLutronMouseout)
            .on('mousedown', beginDragline)
            .on('mousemove', moveDragline)
            .on('mouseup', onControllerMouseup);

        fixtures[selected.attr('id')].shape = 'rect';

        selected.remove();
        selected = next;
    }

    deselectFixt();
}

/** Updates price estimate on screen */
function updatePriceEst() {
    let minSpan = document.getElementById('price-est-min');
    let maxSpan = document.getElementById('price-est-max');

    minSpan.innerHTML = minPrice;
    maxSpan.innerHTML = maxPrice;
}

/** Allows for downloading sketch as JSON file. 
 * Exports the 'fixtures' data object as JSON in 'sketch.csta' file. */
function saveSketchFile(e) {

    // Save locations in SVG:
    deselectFixt();

    let data = new Blob([JSON.stringify(fixtures)], {type: 'application/json'});
    if (data.size <= 2) 
        // There are no fixtures.
        return;


    let url = window.URL.createObjectURL(data);

    let link = document.getElementById('hidden-link');
    link.download = 'sketch.csta';
    link.href = url;
    link.click();
}

/** Loads previously saved JSON file. */
function loadSketchFile(e) {
    let file = e.target.files[0];

    if (!/\.csta$/.test(file.name)) {
        // Invalid file
        alert("This is not a valid design file.");
        return;
    }
    
    // Reset idxCounter and clear old devices:
    idxCounter = 0;
    acc.node().innerHTML = '';

    let reader = new FileReader();
    reader.addEventListener("load", function(e) {
        console.log(reader.result);
        let newFixtures = JSON.parse(reader.result);

        Object.keys(newFixtures).forEach( k => {

            // Meta
            idxCounter++;
            let v = newFixtures[k];
            let isInit = (v.controls.length ? '' : 'init ');

            // Update pricing:
            minPrice += v.price[0];
            maxPrice += v.price[1];

            // Add figures to SVG:

            if (v.shape == 'rect') {
                // Is a controller:

                acc.append('rect')
                    .attr('id', k)
                    .attr('class', isInit + 'lutron')
                    .attr('x', v.loc[0] - 8)
                    .attr('y', v.loc[1] - 8)
                    .attr('width', 16)
                    .attr('height', 16)
                    .attr('draggable', 'true')
                    .on('click', fixtureClick)
                    .on('mouseover', onLutronMouseover)
                    .on('mouseout', onLutronMouseout)
                    .on('mousedown', beginDragline)
                    .on('mousemove', moveDragline)
                    .on('mouseup', onControllerMouseup);
            }

            else if (v.shape == 'circle') {
                // Is a remote:

                acc.append('circle')
                    .attr('id', k)
                    .attr('class', isInit + 'lutron remote')
                    .attr('cx', v.loc[0])
                    .attr('cy', v.loc[1])
                    .attr('r', 8)
                    .attr('draggable', 'true')
                    .on('click', fixtureClick)
                    .on('mouseover', onLutronMouseover)
                    .on('mouseout', onLutronMouseout)
                    .on('mousedown', beginDragline)
                    .on('mousemove', moveDragline)
                    .on('mouseup', onRemoteMouseup);
            }
        });

        delete fixtures;
        fixtures = newFixtures;

        updatePriceEst();
    });
    
    reader.readAsText(file);
}