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

// alternate model data, to be parsed and loaded.
var DataShareLoader = {
    
    url : false,
    urlDataObj : false,
    
    load : function (fromURL) {
        this.url = fromURL;
        this.initFromMembers();
		CorrectorUIManager.onUserInput();
    },
    
    initFromMembers : function () {
		this.urlDataObj = false;
        if (!this.url)
            return;
        if (!Initialization.doneInit) {
            setTimeout (function () {DataShareLoader.initFromMembers(); }, 1);
            return;
        }
        
        this.initDataObj();
		if (this.urlDataObj)
			this.loadFromObj();
    },
    
    initDataObj : function () {
        var hashes = this.url.split ('#');
        if (hashes.length != 2)
            return;
        this.urlDataObj = JSON.parse (decodeURIComponent(hashes[1]));
    },
    
    loadFromObj : function () {
        Log.message ("Loading from URL ...");
		if (this.urlDataObj.lat)
			Location.latitude = Computations.evalNum(this.urlDataObj.lat);
		
		if (this.urlDataObj.long)
			Location.longitude = Computations.evalNum(this.urlDataObj.long);
		
		if (this.urlDataObj.dateTime)
			Location.enteredTime = this.urlDataObj.dateTime;
        
		Location.Controls.update();	
		// TODO: user input update
        if (this.urlDataObj.id)
			ChartController.ui.variableStarElem.value = this.urlDataObj.id;
		
		if (this.urlDataObj.fov)
				ChartController.ui.fovElem.value = this.urlDataObj.fov;
			
		if (this.urlDataObj.maglim)
				ChartController.ui.limittingMagnitudeElem.value = this.urlDataObj.maglim;
        
        // extinction value
		document.getElementById ("K").value = this.urlDataObj.K;
        // extinction value vs. determined
		CorrectorUIManager.useValueForK.checked = this.urlDataObj.useValueForK;
        CorrectorUIManager.computeK.checked = !CorrectorUIManager.useValueForK.checked;

        ChartController.ui.updateChartButton.onclick();
    },
    
    setUserInputData : function () {
        var urlDataObj = this.urlDataObj;
		if (!urlDataObj)
			return;
		
		EstimationCorrector.updateAirmassFromInput (PhotmetryTable.variableStar);

        // brightness estimates
		// ... clear the list up first?
        var i = 0;
        for (i = 0; i < EstimationCorrector.pairedComparisons.length && i < urlDataObj.brightComps.length; i++)
            this.copyComparisonData (EstimationCorrector.pairedComparisons[i], urlDataObj.brightComps [i]);
            
        // add remaining comparisons
        for (; i < urlDataObj.brightComps.length; i++) {
            var addedObject = EstimationCorrector.addNewComparison();
            // set values via the addedObject.comp
            this.copyComparisonData (addedObject.comp, urlDataObj.brightComps [i]);
        }
        
        EstimationCorrector.pairedComparisons.length = urlDataObj.brightComps.length;
        // after setting all, call update on EstimationCorrector
        EstimationCorrector.update();
        
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
        this.url = false;
        this.urlDataObj = false;
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

// Other view of the model side, more easily to share and load.
var DataShareSave = {
	
	urlinput : document.getElementById("datashareurl"),
    baseURL : "http://extinction-o-meter.appspot.com/",

    init: function () {
        if (!this.urlinput)
            return;
        
        this.urlinput.onclick = function () { DataShareSave.urlinput.select(); }
        
        this.update();
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
    
	// this is basically a handler
	// that should be registered with a bunch of notifications.
    update: function () {
        if (!this.urlinput)
            return;
        
        var dataObj = {};
        // fetch the data
		dataObj["lat"] = Location.latitude;
		dataObj["long"] = Location.longitude;
		dataObj["dateTime"] = Location.enteredTime;
        // always, always save data here from the photometry table.
		dataObj["id"] = PhotmetryTable.frame.chartID;
		dataObj["fov"] = PhotmetryTable.frame.fov;
		dataObj["maglim"] = PhotmetryTable.frame.maglimit;
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
		
		var serializationFunc = this.ArgelanderExtComp2JSON;
		if (1 ==  CorrectorUIManager.selectedAlgorithm)
			serializationFunc = this.PairedExtComp2JSON;
		
		for (i = 0; i < ExtinctionCoefficient.comparisons.length; i++)
			dataObj["ext"].push(serializationFunc(ExtinctionCoefficient.comparisons[i]));
		
        // stringify it, and build the URL
        var fullURL = this.baseURL + "#" + JSON.stringify(dataObj);
        this.urlinput.value = fullURL;
    }
};

try {
    Initialization.init();
} catch (err) {
}
