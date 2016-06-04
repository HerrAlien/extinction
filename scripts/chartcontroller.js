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

var ChartController = {
    ui : {
        variableStarElem : document.getElementById("variableStarName"),
        limittingMagnitudeElem : document.getElementById("mag"),
        fovElem : document.getElementById("fov"),
        orientationElem : document.getElementById("chartOrientation"),
        updateChartButton : document.getElementById("updateChart")
    },
    
    init : function () {
        var ui = ChartController.ui;
        var starNameInput = ui.variableStarElem;
        var fovInput = ui.fovElem;
        var magInput = ui.limittingMagnitudeElem;

        InputValidator.AddNumberRangeValidator (magInput, 0, 20);
        InputValidator.AddNumberRangeValidator (fovInput, 0, 1200);
        InputValidator.AddStringRequiredValidator (starNameInput, "Value required");

        magInput.oninput = function () { InputValidator.validate (this); }
        fovInput.oninput = function () { InputValidator.validate (this); }
        
        magInput.onfocus = magInput.oninput;
        fovInput.onfocus = fovInput.oninput;
        magInput.onmouseenter = magInput.oninput;
        fovInput.onmouseenter = fovInput.oninput;

        starNameInput.oninput = function () {
            InputValidator.validate (this);
            var starName = this.value;
            if (PhotmetryTable.AAVSO.IsChartID(starName))
            {
                magInput.readOnly = true;
                fovInput.readOnly = true;
                magInput.placeholder = "not needed";
                fovInput.placeholder = "not needed";
                magInput.className = "";
                fovInput.className = "";
                magInput.onfocus = null;
                fovInput.onfocus = null;
                magInput.onmouseenter = null;
                fovInput.onmouseenter = null;
            }
            else
            {
                magInput.readOnly = false;
                fovInput.readOnly = false;
                magInput.placeholder = "[number]";
                fovInput.placeholder = "[number]";
                InputValidator.validate(magInput);
                InputValidator.validate(fovInput);
                magInput.onfocus = magInput.oninput;
                fovInput.onfocus = fovInput.oninput;
                magInput.onmouseenter = magInput.oninput;
                fovInput.onmouseenter = fovInput.oninput;
            }
        }
        
        ui.updateChartButton.onclick = function () {            
            if (!InputValidator.validate (starNameInput))
                return;
            
        	  var fov = fovInput.value;
        	  var limittingMag = magInput.value;
        	  var starName = starNameInput.value;
            if (!PhotmetryTable.AAVSO.IsChartID(starName)) {
                var c = {};
        		    c.elemToMoveTo = magInput;
                if (!InputValidator.validate_internal (c, function() { if ("" == limittingMag) return "Value required"; return ""; } ) ||
                    !InputValidator.validate(magInput))
                    return;
        		    c.elemToMoveTo = fovInput;
                if (!InputValidator.validate_internal (c, function() { if ("" == fov) return "Value required"; return ""; } )||
                    !InputValidator.validate(fovInput))
                    return;
            }
            
        	  Log.message ("Loading photometry table ...");
        	  setTimeout (
                function(){
                    if (PhotmetryTable.AAVSO.IsChartID(starName))
                        PhotmetryTable.initFromChartID (starName);
                    else
                        PhotmetryTable.initFromStarName (starName, fov, limittingMag);
                }, 1);
				
            if (ChartController.onUpdateChartPressed) 
				ChartController.onUpdateChartPressed();
        }
        
        ui.orientationElem.onchange = function () {
    	    SVGChart.chartOrientation = this.value;
    	    SVGChart.redraw();
        }
    },
    
    // this is a callback    
    onUpdateChartPressed : function () {
        DataShareSave.update();
    }
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
