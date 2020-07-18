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
/* Pricing Information              */
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

    
    // if (loc !== null) {
    //     //selectedFixtDiv.style.display = 'block';
    //     selectedFixtDiv.style.bottom = (svgH-loc[1] + 8) + 'px';

    //     if (loc[0] < 580) {
    //         selectedFixtDiv.style.left = (loc[0] + 8) + 'px';
    //         selectedFixtDiv.style.right = 'initial';
    //     }
    //     else {
    //         selectedFixtDiv.style.right = (svgW - (loc[0] - 8)) + 'px';
    //         selectedFixtDiv.style.left = 'initial';
    //     }


    //     if (loc[1] < 250) {
    //         selectedFixtDiv.style.top = (loc[1] + 8) + 'px';
    //         selectedFixtDiv.style.bottom = 'initial';
    //     }
    //     else {
    //         selectedFixtDiv.style.bottom = (svgH-loc[1] + 8) + 'px';
    //         selectedFixtDiv.style.top = 'initial';
    //     }
    // }
}

/** Deselects selected fixture and saves info: */
function deselectFixt() {
    if (selected === null) return;

    selected.classed('selected', false);
    
    fixtures[selected.attr('id')].loc[0] = Number(selected.attr('x'));
    fixtures[selected.attr('id')].loc[1] = Number(selected.attr('y'));

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
                .on('mouseup', function() {

                    // If user releases mouse on lutron device,
                    // don't change anything.
                    d3.selectAll("svg #fixtures > *")
                        .attr("opacity", 1);

                    if (dragline !== null) {
                        dragline.remove();
                        dragline = null;
                    }

                });

            // Create data object:
            fixtures[newId] = {
                    'id'        : newId,
                    'name'      : '',
                    'type'      : '',
                    'shape'     : 'square',
                    'loc'       : loc,
                    'price'     : [0,0],
                    'controls'  : []
                };
            
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
}


/** Capture user keystrokes and execute necessary actions:
 *  - Arrow keys move a device
 *  - Backspace deletes device 
 *  - Esc key deselects device. */
function onKeyStroke(code) {

    if (selected === null) return;

    //newFixtDiv.style.display = 'none';
    selectedFixtDiv.style.display = 'none';
    
    // Arrow keys for movement:
    if (code == 37) {
        // selected.classed('move', true);
        selected.attr('x', Number(selected.attr('x')) - 1 );
    }
    else if (code == 39) {
        // selected.classed('move', true);
        selected.attr('x', Number(selected.attr('x')) + 1 );
    }
    else if (code == 38) {
        // selected.classed('move', true);
        selected.attr('y', Number(selected.attr('y')) - 1 );
    }
    else if (code == 40) {
        // selected.classed('move', true);
        selected.attr('y', Number(selected.attr('y')) + 1 );
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
            
            let loc = [Number(selected.attr('x')), Number(selected.attr('y'))];
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
            loadDeviceDetails();
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

    let t = d3.select(this);
    let loc = d3.mouse(this);

    // Only allowed to drag currently selected lutron device
    if(event.target.id !== selected.attr('id')) return;

    dragline = acc.append('line')
        .attr('id', 'dragline')
        .attr('x1', Number(t.attr('x')) + 5)
        .attr('y1', Number(t.attr('y')) + 5)
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

/** Hover event when "dragging" a dragline over a circuit or fixture */
function onDraglineMouseover() {

    // If no dragline is present:
    if (dragline === null) return;

    let t = d3.select(this);
    circuitHover = this;
    // t.classed('dragline-hover', true);

    d3.selectAll("svg #fixtures > *")
        .attr("opacity", 0.5);

    if (this.parentElement.id != 'fixtures')
        d3.select(this.parentElement).attr('opacity', 1);
    else 
        d3.select(this).attr('opacity', 1);
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
function endDragline() {

    if(selected === null || dragline === null) return;

    // Clean up dragline:
    d3.selectAll("svg #fixtures > *")
        .attr("opacity", 1);

    dragline.remove();
    dragline = null;

    // Add this circuit/fixture to controller's domain!
    if (this.parentElement.id != 'fixtures') {
        // This means fixture is in a circuit (or is a circuit)
        let p = this.parentElement;

        if (d3.select(p).classed('controlled')) 
            alert("There is already a Lutron device controlling this circuit!");

        fixtures[selected.attr('id')].controls.push(p.id);
        d3.select(p).classed('controlled', true);
    }
    else {
        // Fixture is standalone.
        if (d3.select(this).classed('controlled')) 
            alert("There is already a Lutron device controlling this circuit!");

        fixtures[selected.attr('id')].controls.push(this.id);
        d3.select(this).classed('controlled', true);
    }

    //selectedFixtDiv.style.display = 'block';
    selected.classed('init', false);
}


/** Onclick event for selecting a fixture: */
function fixtureClick(id=null) {
    d3.event.preventDefault();
    if (id === null) id = d3.event.target.id;

    if(selected !== null && d3.event.shiftKey) {
        let t = d3.select(this);
        let loc = d3.mouse(this);
        // console.log(window.event.target);

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
function onLutronMouseover() {
    d3.selectAll('svg #fixtures > *, svg #lutron > *')
        .attr('opacity', 0.2);

    let device = d3.select(this);
    let lines = svg.append('g')
        .attr('id', 'hoverlines');

    device.attr('opacity', 1);

    fixtures[this.id].controls.forEach( e => {
        let tgt = d3.select('#' + e);
        tgt.attr('opacity', 1);

        if (tgt.node().tagName == 'g') {
            //console.log('firing');

            console.log(svg.selectAll('#' + e + ' *'));
            
            svg.selectAll('#' + e + ' *')._groups.forEach( f => {

                lines.append('line')
                    .attr('x1', Number(device.attr('x')) + 8)
                    .attr('x2', Number(d3.select('#' + f.id).attr('cx')))
                    .attr('y1', Number(device.attr('y')) + 8)
                    .attr('y2', Number(d3.select('#' + f.id).attr('cy')))
                    .attr('class', 'dragline');

            });
        }
        else 
            lines.append('line')
                .attr('x1', Number(device.attr('x')) + 8)
                .attr('x2', Number(tgt.attr('cx')))
                .attr('y1', Number(device.attr('y')) + 8)
                .attr('y2', Number(tgt.attr('cy')))
                .attr('class', 'dragline');

    });
    
    
}


/** Hover handler for lutron devices */
function onLutronMouseout() {
    let lines = d3.select("svg #hoverlines");

    if (lines !== null) lines.remove();

    d3.selectAll('svg #fixtures > *, svg #lutron > *')
        .attr('opacity', 1);
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


}

/** Executed on submit of "selected fixture" form */
function saveDeviceDetails(e) {
    e = e || window.event;
    e.preventDefault();

    
    
    
    // Update device shape:

    
    
    // Remove old device pricing from estimate
    minPrice -= fixtures[selected.attr('id')].price[0];
    maxPrice -= fixtures[selected.attr('id')].price[1];

    // Device Pricing
    let select = document.getElementById('device-input');
    let newPrice = prices[select.options[select.selectedIndex].value];

    // Includes Pricing
    let selectInc = document.getElementById('includes-input');
    let includePrice = prices[selectInc.options[selectInc.selectedIndex].value];

    // Update estimate with new pricing:
    fixtures[selected.attr('id')].price = [
        newPrice[0] + includePrice[0],
        newPrice[1] + includePrice[1]
    ];
    minPrice += fixtures[selected.attr('id')].price[0];
    maxPrice += fixtures[selected.attr('id')].price[1];
    updatePriceEst();

    // Update other basic info in fixture data object:
    let nameInp = document.getElementById('device-name');
    fixtures[selected.attr('id')].name = nameInp.value;

    deselectFixt();
}

function updatePriceEst() {
    let minSpan = document.getElementById('price-est-min');
    let maxSpan = document.getElementById('price-est-max');

    minSpan.innerHTML = minPrice;
    maxSpan.innerHTML = maxPrice;
}