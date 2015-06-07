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

PhotmetryTable.onInit = function () { 
    var root = PhotmetryTable.searchTree.root;
    ChartXYToRADec.init (root.coords, root.fov);
    ChartXYToRADec.onCoordsChanged = function (radec) {
		var star = PhotmetryTable.searchTree.getClosestStar (radec[0], radec[1]);
		StarsSelection.setSurrentlyHoveredStar(star);
	} 

    ChartXYToRADec.onMouseMove = StarsSelection.preselectionElem.onmousemove;     
    EstimationCorrector.init();
    
    Hipparcos.init(root.coords[0], root.coords[1], root.fov / (2 * 60), root.mag );
//    RA:200 DEC:20 Tolerance:10 Threshold Magnitude 9
    SVGChart.init (root.coords[0], root.coords[1], root.fov, root.mag);
};

document.getElementById("chartOrientation").onchange = function () {
    ChartXYToRADec.chartOrientation = this.value;
}


document.getElementById("dateTime").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("lat").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("long").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("K").oninput = CorrectorUIManager.onLocationOrTimeChanged;

StarsSelection.init();
PhotmetryTable.AAVSO.config.url = "http://127.0.0.1:8080/resources/14727KA.html";

PhotmetryTable.init("", 7);

CorrectorUIManager.init();
Hipparcos.onInit = function () {
    SVGChart.updateStars (Hipparcos.chart.stars);    
}
