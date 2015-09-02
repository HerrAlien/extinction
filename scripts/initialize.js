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
	domElem : document.getElementById("debug").getElementsByTagName("pre")[0],
	message : function (text) {
		Log.domElem.textContent = text;
	}
};

PhotmetryTable.onInit = function () {
	setTimeout (function() {
        var coords = [PhotmetryTable.variableStar.ra, PhotmetryTable.variableStar.dec];
        var frame = PhotmetryTable.frame;   
        EstimationCorrector.init();
        Log.message ("Loading stars from Tycho catalogue ...");
        setTimeout (function() {
                Hipparcos.init(coords[0], coords[1], frame.fov, frame.maglimit);
                SVGChart.init (coords[0], coords[1], frame.fov, frame.maglimit);
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

var magInput = document.getElementById("mag");
var fovInput = document.getElementById("fov");

InputValidator.AddNumberRangeValidator (document.getElementById("lat"), -90, 90);
InputValidator.AddNumberRangeValidator (document.getElementById("long"), 0, 360);
InputValidator.AddNumberMinimumValidator (document.getElementById("K"), 0);
InputValidator.AddNumberRangeValidator (magInput, 0, 20);
InputValidator.AddNumberRangeValidator (fovInput, 0, 1200);

document.getElementById("dateTime").oninput = CorrectorUIManager.onLocationOrTimeChanged;
document.getElementById("lat").oninput = function () { InputValidator.validate (this); CorrectorUIManager.onLocationOrTimeChanged(); }
document.getElementById("long").oninput = function () { InputValidator.validate (this); CorrectorUIManager.onLocationOrTimeChanged(); }
document.getElementById("K").oninput = function () { InputValidator.validate (this); CorrectorUIManager.onLocationOrTimeChanged(); }

var starNameInput = document.getElementById("variableStarName");

InputValidator.AddStringRequiredValidator (starNameInput, "Value required");

magInput.oninput = function () { InputValidator.validate (this); }
fovInput.oninput = function () { InputValidator.validate (this); }

starNameInput.oninput = function () {
    InputValidator.validate (this);
    var starName = this.value;
    if (PhotmetryTable.AAVSO.IsChartID(starName))
    {
        magInput.readOnly = true;
        fovInput.readOnly = true;
        magInput.placeholder = "not needed";
        fovInput.placeholder = "not needed";
    }
    else
    {
        magInput.readOnly = false;
        fovInput.readOnly = false;
        magInput.placeholder = "[number]";
        fovInput.placeholder = "[number]";
    }
}

document.documentElement.onscroll = InputValidator.UpdateErrorLabelPosition;
window.onresize = InputValidator.UpdateErrorLabelPosition;

StarsSelection.init();

CorrectorUIManager.init();
Hipparcos.onInit = function () {
	Log.message ("Done!");
    SVGChart.updateStars (Hipparcos.chart.stars);   	
	SVGChart.drawCenterMark();
	SVGChart.updateComparisonLabels (PhotmetryTable.comparisonStars);
	setTimeout(function() { Log.message (PhotmetryTable.variableStar.name + ", lim. mag.=" + PhotmetryTable.frame.maglimit + ", FOV[']=" + PhotmetryTable.frame.fov + "; chart id=" + PhotmetryTable.frame.chartID);}, 1000);
}

document.getElementById("updateChart").onclick = function () {
    
    if (!InputValidator.validate (starNameInput))
        return;
    
	var fov = fovInput.value;
	var limittingMag = magInput.value;
	var starName = starNameInput.value;
    if (!PhotmetryTable.AAVSO.IsChartID(starName))
    {
        var c = {};
		c.elemToMoveTo = magInput;
        if (!InputValidator.validate_internal (c, function() { if ("" == limittingMag) return "Value required"; return ""; } ))
            return;
		c.elemToMoveTo = fovInput;
        if (!InputValidator.validate_internal (c, function() { if ("" == fov) return "Value required"; return ""; } ))
            return;
    }
    
	Log.message ("Loading photometry table ...");
	setTimeout (
        function(){
            if (PhotmetryTable.AAVSO.IsChartID(starName))
                PhotmetryTable.initFromChartID (starName);
            else
                PhotmetryTable.initFromStarName (starName, fov, limittingMag);
        }, 100);
}
