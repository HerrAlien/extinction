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

var ChartController = {
    ui : {
        chartIDElem : document.getElementById("tableID"),
        variableStarElem : document.getElementById("variableStarName"),
        limittingMagnitudeElem : document.getElementById("mag"),
        fovElem : document.getElementById("fov"),
        orientationElem : document.getElementById("chartOrientation"),
        updateChartButton : document.getElementById("updateChart")
    },
    
    init : function () {
        var ui = ChartController.ui;

        ui.chartIDElem.oninput = function () {
            ui.variableStarElem.readOnly = (ui.chartIDElem.value.length > 4);
        }
        
        ui.updateChartButton.onclick = function () {
            // TODO: call the photometry table methods
            if (ui.variableStarElem.readOnly)
                PhotmetryTable.init (ui.chartIDElem.value, ui.limittingMagnitudeElem.value);
            else
                PhotmetryTable.initFromStarName (ui.variableStarElem.value, ui.limittingMagnitudeElem.value);
            
            // call the callback
            if (ChartController.onUpdateChartPressed)
                ChartController.onUpdateChartPressed();
        }
    },
    
    // this is a callback    
    onUpdateChartPressed : function () {
        
    }
};
