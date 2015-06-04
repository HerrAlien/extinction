/*
Extinction-O-Meter - an HTML & JavaScript utility to compute atmospheric extinction.
               
Copyright 2015  Herr_Alien <garone80@yahoo.com>
                
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
                
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
                
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see https://www.gnu.org/licenses/agpl.html
*/

var elem = document.getElementById ("debug");
var activeSel = document.getElementById ("activeSel");

function onCoordsChanged (radec) {
    var star = PhotmetryTable.searchTree.getClosestStar (radec[0], radec[1]);
    if (star) {
        StarsSelection.currentlyHoveredStar = star;
        elem.innerHTML = star.label;
    }
    // activeSel.innerHTML = StarsSelection.activeSelector.id;
}

function onMouseMove (x, y) {
    elem.style.left = x - 5;
    elem.style.top = y + 25;
}

elem.onmousemove = onMouseMove;

PhotmetryTable.onInit = function () { 
    ChartXYToRADec.init (PhotmetryTable.searchTree.root.coords, PhotmetryTable.searchTree.root.fov);
    ChartXYToRADec.onCoordsChanged = onCoordsChanged; 
    ChartXYToRADec.onMouseMove = onMouseMove; 
    
    EstimationCorrector.init();
};

document.getElementById("chartOrientation").onchange = function () {
    ChartXYToRADec.chartOrientation = this.value;
}


document.getElementById("dateTime").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("lat").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("long").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("K").oninput = CorrectorUIManager.onLocationOrTimeChanged;

StarsSelection.onSelectionActivated = function () {
    elem.className = "visible";
    elem.innerHTML = "";
}

StarsSelection.init();
PhotmetryTable.AAVSO.config.url = "http://127.0.0.1:8080/resources/14727KA.html";

PhotmetryTable.init("", 7);

CorrectorUIManager.init();

