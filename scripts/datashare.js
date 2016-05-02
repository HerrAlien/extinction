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
    
    load : function (fromURL) {
        DataShareLoader.url = fromURL;
        DataShareLoader.initFromMembers();
		CorrectorUIManager.onUserInput();
    },
    
    initFromMembers : function () {
		DataShareLoader.urlDataObj = false;
        if (!DataShareLoader.url)
            return;
        if (!Initialization.doneInit) {
            setTimeout (function () {DataShareLoader.initFromMembers(); }, 1);
            return;
        }
        
        DataShareLoader.initDataObj();
		if (DataShareLoader.urlDataObj)
			DataShareLoader.loadFromObj();
    },
    
    initDataObj : function () {
        var hashes = DataShareLoader.url.split ('#');
        if (hashes.length != 2)
            return;
        DataShareLoader.urlDataObj = JSON.parse (hashes[1])
    },
    
    loadFromObj : function () {
		if (DataShareLoader.urlDataObj.lat)
			LocationUI.latitude.value = DataShareLoader.urlDataObj.lat;
		
		if (DataShareLoader.urlDataObj.long)
			LocationUI.longitude.value = DataShareLoader.urlDataObj.long;
		
		if (DataShareLoader.urlDataObj.dateTime)
			LocationUI.dateTime.value = DataShareLoader.urlDataObj.dateTime;
        // TODO: user input update
        if (DataShareLoader.urlDataObj.id)
			ChartController.ui.variableStarElem.value = DataShareLoader.urlDataObj.id;
        
        
        ChartController.ui.updateChartButton.onclick();
    },
    
    setUserInputData : function () {
        var urlDataObj = DataShareLoader.urlDataObj;
		if (!urlDataObj)
			return;
		
		EstimationCorrector.updateAirmassFromInput (PhotmetryTable.variableStar);

        // brightness estimates
		// ... clear the list up first?
        var i = 0;
        for (i = 0; i < EstimationCorrector.pairedComparisons.length && i < urlDataObj.brightComps.length; i++)
            DataShareLoader.copyComparisonData (EstimationCorrector.pairedComparisons[i], urlDataObj.brightComps [i]);
            
        // add remaining comparisons
        for (; i < urlDataObj.brightComps.length; i++) {
            var addedObject = EstimationCorrector.addNewComparison();
            // set values via the addedObject.comp
            DataShareLoader.copyComparisonData (addedObject.comp, urlDataObj.brightComps [i]);
        }
        
        EstimationCorrector.pairedComparisons.length = urlDataObj.brightComps.length;
        // after setting all, call update on EstimationCorrector
        EstimationCorrector.update();
        
        // extinction value
		document.getElementById ("K").value = urlDataObj["K"];
        // extinction value vs. determined
		CorrectorUIManager.useValueForK.checked = urlDataObj["useValueForK"];
        CorrectorUIManager.computeK.checked = !CorrectorUIManager.useValueForK.checked;

        // extinction comparisons
        var xformFunc = DataShareLoader.copyArgelanderExtComp;
        CorrectorUIManager.useArgelander.checked = true;
        CorrectorUIManager.usePaired.checked = !CorrectorUIManager.useArgelander.checked;
        CorrectorUIManager.useArgelander.onclick();
        
        // extinction algorithm
		CorrectorUIManager.selectedAlgorithm = urlDataObj["algo"];

        if (1 == CorrectorUIManager.selectedAlgorithm){
            xformFunc = DataShareLoader.copyPairedExtComp;
            CorrectorUIManager.useArgelander.checked = false;
            CorrectorUIManager.usePaired.checked = !CorrectorUIManager.useArgelander.checked;
            CorrectorUIManager.usePaired.onclick();
        }
        
		// first, 	set the ones already existing
		for (i = 0; i < urlDataObj["ext"].length && i < ExtinctionCoefficient.comparisons.length; i++)
		{
			var sourceObj = urlDataObj["ext"][i];
			var destinationComp =  ExtinctionCoefficient.comparisons[i];
			// copy from urlDataObj["ext"][i];
            xformFunc (destinationComp, sourceObj);
		}
        
        for (; i < urlDataObj["ext"].length; i++) {
            var sourceObj = urlDataObj["ext"][i];
            var row = CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow();
			var destinationComp = ExtinctionCoefficient.comparisons[ExtinctionCoefficient.comparisons.length - 1];
            // copy from urlDataObj["ext"][i];
            xformFunc (destinationComp, sourceObj);
        }
		ExtinctionCoefficient.comparisons.length = urlDataObj["ext"].length;
        // clear up member data
        DataShareLoader.url = false;
        DataShareLoader.urlDataObj = false;
        // finally, user input update.
    },
    
    
    copyComparisonData : function (comp, compToAdd) {
        // stars to add are indices in the photometry table ...
		if (compToAdd.b >= 0 && compToAdd.b < PhotmetryTable.comparisonStars.length) {
			var st = PhotmetryTable.comparisonStars[compToAdd.b]; 
			EstimationCorrector.updateAirmassFromInput (st);
			comp.first.ui.brightSelector.set (st);
		}
        comp.first.ui.valueLineEdit.value = compToAdd.b2v;
        comp.first.ui.dimSelector.set (PhotmetryTable.variableStar);
        comp.second.ui.brightSelector.set (PhotmetryTable.variableStar);
        comp.second.ui.valueLineEdit.value = compToAdd.v2d;
		if (compToAdd.d >= 0 && compToAdd.d < PhotmetryTable.comparisonStars.length){
			var st = PhotmetryTable.comparisonStars[compToAdd.d]; 
			EstimationCorrector.updateAirmassFromInput (st);
			comp.second.ui.dimSelector.set (st);
		}
		
		// do whatever is done when using a new estimate
		comp.updateUI();
		comp.updateRating();
    },
    
    copyArgelanderExtComp : function (extComp, urlObjComp) {
        if (urlObjComp.b >= 0 && urlObjComp.b < PhotmetryTable.comparisonStars.length) {
            var st = PhotmetryTable.comparisonStars[urlObjComp.b]; 
			EstimationCorrector.updateAirmassFromInput (st);
			extComp.ui.brightSelector.set (st);
        }
        
        if (urlObjComp.d >= 0 && urlObjComp.d < PhotmetryTable.comparisonStars.length) {
            var st = PhotmetryTable.comparisonStars[urlObjComp.d]; 
			EstimationCorrector.updateAirmassFromInput (st);
			extComp.ui.dimSelector.set (st);
        }
        extComp.ui.valueLineEdit.value = urlObjComp["b2d"];
        extComp.updateUI();
		extComp.updateRating();
    },
    
    copyPairedExtComp : function (extComp, urlObjComp) {

        if (urlObjComp.b >= 0 && urlObjComp.b < PhotmetryTable.comparisonStars.length) {
            var st = PhotmetryTable.comparisonStars[urlObjComp.b]; 
			EstimationCorrector.updateAirmassFromInput (st);
			extComp.first.ui.brightSelector.set (st);
        }
        
        if (urlObjComp.m >= 0 && urlObjComp.m < PhotmetryTable.comparisonStars.length) {
            var st = PhotmetryTable.comparisonStars[urlObjComp.m]; 
			EstimationCorrector.updateAirmassFromInput (st);
			extComp.first.ui.dimSelector.set (st);
        }

        if (urlObjComp.d >= 0 && urlObjComp.d < PhotmetryTable.comparisonStars.length) {
            var st = PhotmetryTable.comparisonStars[urlObjComp.d]; 
			EstimationCorrector.updateAirmassFromInput (st);
			extComp.second.ui.dimSelector.set (st);
        }
        extComp.first.ui.valueLineEdit.value = urlObjComp["b2m"];
        extComp.second.ui.valueLineEdit.value = urlObjComp["m2d"];
        extComp.updateUI();
		extComp.updateRating();
    }


};

var DataShareSave = {
	
	urlinput : document.getElementById("datashareurl"),
    baseURL : "http://extinction-o-meter.appspot.com/",

    init: function () {
        if (!DataShareSave.urlinput)
            return;
        
        DataShareSave.urlinput.onclick = function () { DataShareSave.urlinput.select(); }
        
        DataShareSave.update();
    },
	
	ArgelanderExtComp2JSON : function (comp) {
		var obj = {};
		obj["b"] = PhotmetryTable.comparisonStars.indexOf (comp.bright());
		obj["b2d"] = comp.value();
		obj["d"] = PhotmetryTable.comparisonStars.indexOf (comp.dim());
		return obj;
	},
	
	PairedExtComp2JSON : function (comp) {
		var obj = {};
		obj["b"] = PhotmetryTable.comparisonStars.indexOf (comp.first.bright());
		obj["b2m"] = comp.first.value();
		obj["m"] = PhotmetryTable.comparisonStars.indexOf (comp.first.dim());
		obj["m2d"] = comp.second.value();
		obj["d"] = PhotmetryTable.comparisonStars.indexOf (comp.second.dim());
		return obj;
	},
    
    update: function () {
        if (!DataShareSave.urlinput)
            return;
        
        var dataObj = {};
        // fetch the data
		dataObj["lat"] = LocationUI.latitude.value;
		dataObj["long"] = LocationUI.longitude.value;
		dataObj["dateTime"] = LocationUI.dateTime.value;
		dataObj["id"] = ChartController.ui.variableStarElem.value;
	    dataObj["brightComps"] = [];
		var i = 0;
		for (i = 0; i < EstimationCorrector.pairedComparisons.length; i++) {
			var objToAdd = {};
			var comparisonToSave = EstimationCorrector.pairedComparisons[i];
			// index of the bright star in the PhotmetryTable.comparisonStars
			objToAdd["b"] = PhotmetryTable.comparisonStars.indexOf(comparisonToSave.first.bright());
			objToAdd["b2v"] = comparisonToSave.first.value();
			objToAdd["v2d"] = comparisonToSave.second.value();
			objToAdd["d"] = PhotmetryTable.comparisonStars.indexOf(comparisonToSave.second.dim());
			dataObj["brightComps"].push(objToAdd);
		}
		
		dataObj["K"] = document.getElementById ("K").value;
		dataObj["useValueForK"] = document.getElementById ("useValueForK").checked;
		dataObj["algo"] = CorrectorUIManager.selectedAlgorithm;
		
		dataObj["ext"] = [];
		
		var serializationFunc = DataShareSave.ArgelanderExtComp2JSON;
		if (1 ==  CorrectorUIManager.selectedAlgorithm)
			serializationFunc = DataShareSave.PairedExtComp2JSON;
		
		for (i = 0; i < ExtinctionCoefficient.comparisons.length; i++)
			dataObj["ext"].push(serializationFunc(ExtinctionCoefficient.comparisons[i]));
		
        // stringify it, and build the URL
        var fullURL = DataShareSave.baseURL + "#" + JSON.stringify(dataObj);
        DataShareSave.urlinput.value = fullURL;
    }
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
