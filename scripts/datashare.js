/*
Extinction-O-Meter - an HTML & JavaScript utility to apply differential 
extinction corrections to brightness estimates
               
Copyright 2016  Herr_Alien <garone80@yahoo.com>
                
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

var DataShareLoader = {
    
    url : false,
    urlDataObj : false,
    
    callbacks : {
        AAVSO : false,
        HIPPARCOS : false
    },
    
    load : function (fromURL) {
        DataShareLoader.url = fromURL;
        DataShareLoader.initFromMembers();
    },
    
    initFromMembers : function () {
        if (!DataShareLoader.url)
            return;
        if (!Initialization.doneInit) {
            setTimeout (function () {DataShareLoader.initFromMembers(); }, 100);
            return;
        }
        
        DataShareLoader.initDataObj();
        DataShareLoader.loadFromObj();
    },
    
    initDataObj : function () {
        var hashes = DataShareLoader.url.split ('#');
        if (hashes.length != 2)
            return;
        DataShareLoader.urlDataObj = JSON.parse (hashes[1])
    },
    
    loadFromObj : function () {
        LocationUI.latitude.value = DataShareLoader.urlDataObj.lat;
        LocationUI.longitude.value = DataShareLoader.urlDataObj.long;
        LocationUI.dateTime.value = DataShareLoader.urlDataObj.dateTime;
        // TODO: user input update
        
        ChartController.ui.variableStarElem.value = DataShareLoader.urlDataObj.id;
        
        // save various callbacks (PhotmetryTable.onInit, Hipparcos.onInit)
        DataShareLoader.callbacks.AAVSO = PhotmetryTable.onInit;
        DataShareLoader.callbacks.HIPPARCOS = Hipparcos.onInit;
        
        PhotmetryTable.onInit = function () {
            DataShareLoader.callbacks.AAVSO();
            DataShareLoader.setUserInputData ();
        }
        
        Hipparcos.onInit = function () {
            DataShareLoader.callbacks.HIPPARCOS();
            DataShareLoader.restoreCallbacks();
        }
        
        ChartController.ui.updateChartButton.onclick();
    },
    
    setUserInputData : function () {
        var urlDataObj = DataShareLoader.urlDataObj;

        // brightness estimates
        var i = 0;
        for (i = 0; i < EstimationCorrector.pairedComparisons.length && i < urlDataObj.brightComps.length; i++)
            DataShareLoader.copyBrightnessEstimateComp (EstimationCorrector.pairedComparisons[i], urlDataObj.brightComps [i]);
            
        // add remaining comparisons
        for (; i < urlDataObj.brightComps.length; i++) {
            var addedObject = EstimationCorrector.addNewComparison();
            // set values via the addedObject.comp
            DataShareLoader.copyBrightnessEstimateComp (addedObject.comp, urlDataObj.brightComps [i]);
        }
        // after setting all, call update on EstimationCorrector
        EstimationCorrector.update();
        
        // extinction value
        // extinction value vs. determined
        // extinction algorithm
        // extinction comparisons
        
        // clear up member data
        DataShareLoader.url = false;
        DataShareLoader.urlDataObj = false;
        // finally, user input update.
    },
    
    restoreCallbacks : function () {
        PhotmetryTable.onInit = DataShareLoader.callbacks.AAVSO;
        Hipparcos.onInit = DataShareLoader.callbacks.HIPPARCOS;
        DataShareLoader.callbacks.AAVSO = false;
        DataShareLoader.callbacks.HIPPARCOS = false;
    },
    
    copyComparisonData : function (comp, compToAdd) {
        // stars to add are indices in the photometry table ...
        comp.first.ui.brightSelector.set (PhotmetryTable.comparisonStars[compToAdd.b]);
        comp.first.ui.valueLineEdit.value = compToAdd.b2v;
        comp.first.ui.dimSelector.set (PhotmetryTable.variableStar);
        comp.second.ui.brightSelector.set (PhotmetryTable.variableStar);
        comp.second.ui.valueLineEdit.value = compToAdd.v2d;
        comp.second.ui.dimSelector.set (PhotmetryTable.comparisonStars[compToAdd.d]);
    }

};

var DataShareSave = {
    onSaveClicked : function () {
        /*chrome.app.window.create('share.html', { id: 'share', bounds: { width: 640, height: 120 } },
        function(win) {
            // win.contentWindow;
            // set the link
            // associate the onclick handler
        });*/
    },
    
    init: function () {
        var link = document.getElementById("shareDataLink");
        link.onclick = function () {
            DataShareSave.onSaveClicked();
        }
    }
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
