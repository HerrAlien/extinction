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

var Log = {
	domElem : document.getElementById("debug"),
	message : function (text) {
		Log.domElem.innerHTML = text;
	}
};

PhotmetryTable.onInit = function () { 
	Log.message ("Photometry table loaded.")
    var root = PhotmetryTable.searchTree.root;     
    EstimationCorrector.init();
	Log.message ("Loading stars from Tycho catalogue ...");
    Hipparcos.init(root.coords[0], root.coords[1], root.fov, root.mag );
    SVGChart.init (root.coords[0], root.coords[1], root.fov, root.mag);
	SVGChart.drawBorder ();
}

document.getElementById("chartOrientation").onchange = function () {
	SVGChart.chartOrientation = this.value;
	SVGChart.drawBorder ();
	SVGChart.redrawStars();
	SVGChart.drawCenterMark();
	SVGChart.redrawLabels();	
}


document.getElementById("dateTime").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("lat").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("long").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("K").oninput = CorrectorUIManager.onLocationOrTimeChanged;

StarsSelection.init();

CorrectorUIManager.init();
Hipparcos.onInit = function () {
	Log.message ("Done!");
    SVGChart.updateStars (Hipparcos.chart.stars);   	
	SVGChart.drawCenterMark();
	SVGChart.updateComparisonLabels (PhotmetryTable.comparisonStars);
	setTimeout(function() { Log.message ("&nbsp;");}, 1000);
}

document.getElementById("updateChart").onclick = function () {
	var starName = document.getElementById("variableStarName").value;
	var fov = document.getElementById("fov").value;
	var limittingMag = document.getElementById("mag").value;

	PhotmetryTable.initFromStarName (starName, fov, limittingMag);
}
