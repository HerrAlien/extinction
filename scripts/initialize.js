/*
Extinction-O-Meter - an HTML & JavaScript utility to apply differential 
extinction corrections to brightness estimates
               
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
	setTimeout (function() {
        var root = PhotmetryTable.searchTree.root;     
        EstimationCorrector.init();
        Log.message ("Loading stars from Tycho catalogue ...");
        setTimeout (function() {
                Hipparcos.init(root.coords[0], root.coords[1], root.fov, root.mag );
                SVGChart.init (root.coords[0], root.coords[1], root.fov, root.mag);
                SVGChart.drawBorder ();
            }, 100);
        }, 100);
}

document.getElementById("chartOrientation").onchange = function () {
	SVGChart.chartOrientation = this.value;
	SVGChart.drawBorder ();
	SVGChart.redrawStars();
	SVGChart.drawCenterMark();
	SVGChart.redrawLabels();	
}

InputValidator.AddNumberRangeValidator (document.getElementById("lat"), -90, 90);
InputValidator.AddNumberRangeValidator (document.getElementById("long"), 0, 360);
InputValidator.AddNumberMinimumValidator (document.getElementById("K"), 0);
InputValidator.AddNumberRangeValidator (document.getElementById("mag"), 0, 20);
InputValidator.AddNumberRangeValidator (document.getElementById("fov"), 0, 1200);

document.getElementById("dateTime").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("lat").oninput = function () { InputValidator.validate (this); CorrectorUIManager.onLocationOrTimeChanged(); }
document.getElementById("long").oninput = function () { InputValidator.validate (this); CorrectorUIManager.onLocationOrTimeChanged(); }
document.getElementById("K").oninput = function () { InputValidator.validate (this); CorrectorUIManager.onLocationOrTimeChanged(); }
document.getElementById("mag").oninput = function () { InputValidator.validate (this); }
document.getElementById("fov").oninput = function () { InputValidator.validate (this); }

document.documentElement.onscroll = InputValidator.UpdateErrorLabelPosition;
window.onresize = InputValidator.UpdateErrorLabelPosition;

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
	Log.message ("Loading photometry table ...");
	var starName = document.getElementById("variableStarName").value;
	var fov = document.getElementById("fov").value;
	var limittingMag = document.getElementById("mag").value;
	setTimeout (
        function(){
            PhotmetryTable.initFromStarName (starName, fov, limittingMag);
        }, 100);
}
