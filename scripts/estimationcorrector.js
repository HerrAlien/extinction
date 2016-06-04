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

/* ... a mix of everything. */
var EstimationCorrector = {
    // --- model side ------
    // a collection of comparisons, with airmasses, just to determine the brightness,
    // given an extinction coefficient.
    pairedComparisons : [],
    
    Estimate : function (k){
        
        var i = 0;
        var values = [];
        for (i = 0; i < EstimationCorrector.pairedComparisons.length; i++) {
			var pairedComparison = EstimationCorrector.pairedComparisons[i];
			var bright = pairedComparison.first.bright();
			var b2v = pairedComparison.first.value();
			var variable = pairedComparison.first.dim(); // or second.bright () ...
			var v2d = pairedComparison.second.value();
			var dim = pairedComparison.second.dim(); 
				
			// provide corrections for the difference airmass
			var brightMag = bright.mag + k * (bright.airmass - variable.airmass);
			var dimMag = dim.mag + k * (dim.airmass - variable.airmass);
				
			if (b2v == 0 && v2d == 0)
				values.push(brightMag);
			else
				values.push (brightMag + b2v * (dimMag - brightMag) / (b2v + v2d));
        }
        
        return values;
    },
    
    init : function () {
		// reset estimates
        EstimationCorrector.pairedComparisons = [];
		// empty the table of estimates ...
		var table = CorrectorUIManager.extraEstimatesTable;
		while (table.hasChildNodes())
			table.removeChild (table.firstChild);
		// add the first estimate
        EstimationCorrector.addNewComparison ();

		// reset the estimates for extinction
		CorrectorUIManager.ClearComparisonsList();
        CorrectorUIManager.ResetHeader();	
		CorrectorUIManager.useArgelander.onclick();
        CorrectorUIManager.useArgelander.checked = true;
    },
    
    updateAirmassFromInput : function (star) {
        var latitude = Computations.evalNum (document.getElementById ("lat").value);
        var longitude = Computations.evalNum (document.getElementById ("long").value);
        var timeString = document.getElementById ("dateTime").value;
            
        var lst = Computations.LSTFromTimeString (timeString, longitude);
        ExtinctionCoefficient.updateAirmassForStar (star, latitude, longitude, lst);        
    },
    
    // this is a control side of things.
    addNewComparison : function () {
        var table = CorrectorUIManager.extraEstimatesTable;
        var createdObj = CorrectorUIManager.Utils.AddPairedComparison (table);
        CorrectorUIManager.Utils.AddDeleteLink (createdObj.row, createdObj.tddelete, createdObj.comp, EstimationCorrector.pairedComparisons);

        createdObj.midSelector.set (PhotmetryTable.variableStar);
        createdObj.midSelector.show (false);

        EstimationCorrector.pairedComparisons.push (createdObj.comp);
        var createdSpan = CorrectorUIManager.Utils.AddChild (createdObj.tdmid, "span");
        createdSpan.textContent = "V";
        
        var addChild = CorrectorUIManager.Utils.AddChild;
        (function() {
            // set a ratings evaluation method. Yes, even vor the brightness estimates, we need a way to assess if they're ok or not.
            // also set up a DOM element that can have the bg altered
            var tdRating = addChild(createdObj.row, "td");
            var ratingDiv = addChild (tdRating, "div");
            ratingDiv.className = "norating";
            // this is a view thing, for one comparison.
            createdObj.comp["updateRating"] = function ()
            {
                var initialComparisons = EstimationCorrector.pairedComparisons;
                var estimatesWithMe = EstimationCorrector.Estimate(0);
                
                var myPos = initialComparisons.indexOf(this);
                var compsWOMe = initialComparisons.slice(0, myPos).concat (initialComparisons.slice (myPos+1, initialComparisons.length));
                EstimationCorrector.pairedComparisons = compsWOMe;
                var estimatesWOMe = EstimationCorrector.Estimate(0);
                // restore the data
                EstimationCorrector.pairedComparisons = initialComparisons;
                
                var statsWOMe = Computations.AverageAndStdDev (estimatesWOMe);
                var statsWithMe = Computations.AverageAndStdDev (estimatesWithMe);
                
                var ratingLabels = [ "sad", "meh", "happy"];
                var rating = Computations.CompareStats (statsWOMe, statsWithMe, {"avgStdDevRatio" : 0.5, "stdDevAbsError" : 0.1, "stdDevMaxAbsError" : 0.2} );                    
                ratingDiv.className = ratingLabels[rating];
            }
        })();
        
        return createdObj;
    },
    
    update : function () {
        var i = 0;
        for (i = 0; i < EstimationCorrector.pairedComparisons.length; i++) {
            var pairedComparison = EstimationCorrector.pairedComparisons[i];
            pairedComparison.updateUI();
			try {
				pairedComparison.updateRating();
			} catch (err) {
				;
			}
        }
    
    }
};

// control, mostly
var CorrectorUIManager = {
    table : document.getElementById("extinctionEstimates"),
    tableHeader : document.getElementById("extinctionEstimatesHeader"), 
    
    useValueForK : document.getElementById ("useValueForK"),
    computeK : document.getElementById ("computeK"),
    useArgelander : document.getElementById ("useArgelander"),
    usePaired : document.getElementById ("usePaired"),
    
    addVariableEstimateLink : document.getElementById ("addEstimateLink"),
    extraEstimatesTable : document.getElementById ("extraEstimates"), 
    
    selectedAlgorithm : 0,
    
    init : function () {
		
		StarsSelection.afterStarSelection.add (CorrectorUIManager.onUserInput);
		
        CorrectorUIManager.useValueForK.onclick = function () {
            CorrectorUIManager.computeK.checked = false;
            CorrectorUIManager.onUserInput();
        }
        CorrectorUIManager.computeK.onclick = function () {
            CorrectorUIManager.useValueForK.checked = false;
            CorrectorUIManager.onUserInput();
        }
        CorrectorUIManager.addVariableEstimateLink.onclick = function () {
            EstimationCorrector.addNewComparison ();
        }
        
        CorrectorUIManager.useArgelander.onclick = function () {
            CorrectorUIManager.usePaired.checked = false;
            CorrectorUIManager.selectedAlgorithm = 0;
            ExtinctionCoefficient.currentAlgorithmID = 0;
            CorrectorUIManager.ClearComparisonsList();
            CorrectorUIManager.ResetHeader();
            try{
            CorrectorUIManager.onUserInput();
            } catch (err) {}
        }
        CorrectorUIManager.usePaired.onclick = function () {
            CorrectorUIManager.useArgelander.checked = false;
            CorrectorUIManager.selectedAlgorithm = 1;
            ExtinctionCoefficient.currentAlgorithmID = 1;
            CorrectorUIManager.ClearComparisonsList();
            CorrectorUIManager.ResetHeader();
            try{
            CorrectorUIManager.onUserInput();
            } catch (err) {}
        }
        
        CorrectorUIManager.useArgelander.onclick();
        CorrectorUIManager.useArgelander.checked = true;
        
        var currentDate = new Date();
        
        var month = currentDate.getMonth() + 1;
        if (month < 10)
            month = "0" + month;
        
        var day = currentDate.getUTCDate();
        if (day < 10)
            day = "0" + day;
        
        var h = currentDate.getUTCHours();
        if (h < 10)
            h = "0" + h;
        
        var m = currentDate.getUTCMinutes();
        if (m < 10)
            m = "0" + m;

        var s = currentDate.getUTCSeconds();
        if (s < 10)
            s = "0" + s;

        document.getElementById("dateTime").value = currentDate.getUTCFullYear() + "/" + month + "/" + day +
                                                    " " + h + ":" + m + ":" + s;
        
        document.getElementById("geolocation").onclick = function () {
			var geoLocation = navigator.geolocation || window.navigator.geolocation;
            if (geoLocation) {
                geoLocation.getCurrentPosition (function (position) {
                    var lat = document.getElementById("lat");
                    var long = document.getElementById("long");
                    lat.value = position.coords.latitude;
                    long.value = position.coords.longitude;
                    InputValidator.validate (lat);
                    InputValidator.validate (long);
                    CorrectorUIManager.onLocationOrTimeChanged();
                    
               });
            }
        }
    },
    
    ResetHeader : function () {
        var addChild = CorrectorUIManager.Utils.AddChild;
        CorrectorUIManager.Utils.ClearDOM(CorrectorUIManager.tableHeader);
        if (0 == CorrectorUIManager.selectedAlgorithm) {
            var tdbright =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdval =  addChild (CorrectorUIManager.tableHeader, "td");
            var tddim =  addChild (CorrectorUIManager.tableHeader, "td");

            tdbright.textContent = "Bright star"; 
            tddim.textContent = "Dim star"; 
            tdval.textContent = "steps"; 
        } else {
            var tdbright =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdval_bm =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdmid =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdval_md =  addChild (CorrectorUIManager.tableHeader, "td");
            var tddim =  addChild (CorrectorUIManager.tableHeader, "td");

            tdbright.textContent = "Bright star"; 
            tdval_bm.textContent = "steps"; 
            tddim.textContent = "Dim star"; 
            tdval_md.textContent = "steps"; 
            tdmid.textContent = "Middle star"; 
        }

        var tdadd =  addChild (CorrectorUIManager.tableHeader, "td");
        var anch = addChild(tdadd, "a");
        anch.textContent = "(+) Add row";
        anch.noref="";
        anch.className = "addAnchor";
        anch.onclick = function () {
                CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow();
        }
        
        var tdRating = addChild (CorrectorUIManager.tableHeader, "td");
        tdRating.style["background"] = "#ffffff";
        CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow(); // one compariso is enough for pairs
        if (0 == CorrectorUIManager.selectedAlgorithm)
            CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow(); // two, for Argelander
    },
    
    algorithms : ["Argelander", "Paired"],
    
    ClearComparisonsList : function () {
        ExtinctionCoefficient.comparisons = [];
        CorrectorUIManager.Utils.ClearDOM (CorrectorUIManager.table);
    },
    
    Utils : {
        ClearDOM : function (elem) {
            while (elem && elem.hasChildNodes())
                elem.removeChild(elem.firstChild);
        },
        
        AddChild : function (parentElem, tag) {
            var doc = parentElem.ownerDocument;
            var res = doc.createElement (tag);
            parentElem.appendChild (res);
            return res;
        },
        
        AddDeleteLink : function (_row, _tddelete, _comp, 
                                  _arrayToRemoveComparisonFrom) {
            var addChild = CorrectorUIManager.Utils.AddChild;
            (function (r, t, c, a) {
                var tddelete = t;
                var deleteAnchor = addChild (tddelete, "a");
                var comp = c;
                var arr = a;
                deleteAnchor.textContent = "(x) Delete row";
                deleteAnchor.className = "deleteAnchor";
                var tr = r;
                deleteAnchor.onclick = function () {
                    var i = 0; 
                    CorrectorUIManager.Utils.ClearDOM (tr);
                    tr.parentElement.removeChild (tr);
                    delete tr;
                
                    // var isAt = ExtinctionCoefficient.comparisons.indexOf (comp);
                    var isAt = arr.indexOf (comp);
                    arr.splice (isAt, 1);
                    CorrectorUIManager.onUserInput();
                }
            })(_row, _tddelete, _comp, _arrayToRemoveComparisonFrom);            
        },
        
        AddPairedComparison : function (table) {
            var addChild = CorrectorUIManager.Utils.AddChild;
            
            var row = addChild (table, "tr");
            var tdbright =  addChild (row, "td");
            var brightInput = addChild (tdbright, "input");
            var tdval_bm =  addChild (row, "td");
            var b2m = addChild (tdval_bm, "input");
            var tdmid =  addChild (row, "td");
            var midImput = addChild (tdmid, "input");
            var tdval_md =  addChild (row, "td");
            var m2d = addChild (tdval_md, "input");
            var tddim =  addChild (row, "td");
            var dimInput = addChild (tddim, "input");
            var tddelete =  addChild (row, "td");
            
            b2m.size = 3;
            m2d.size = 3;
            
            b2m.placeholder = "[number]";
            m2d.placeholder = "[number]";
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var midSelector = StarsSelection.Selector.build (midImput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            
			InputValidator.AddNumberMinimumValidator (b2m, 0);
			InputValidator.AddNumberMinimumValidator (m2d, 0);
			
            b2m.onfocus = function () {InputValidator.validate(this); }
            m2d.onfocus = function () {InputValidator.validate(this); }

            b2m.oninput = function () { this.onfocus(); CorrectorUIManager.onUserInput();}
            m2d.oninput = function () { this.onfocus(); CorrectorUIManager.onUserInput();}
            
            b2m.onmouseenter = b2m.onfocus;
            m2d.onmouseenter = m2d.onfocus;

            var comp = ExtinctionCoefficient.PairedComparison(brightSelector, b2m, midSelector, m2d, dimSelector);
            return { "comp": comp, "midSelector" : midSelector, "tdmid" : tdmid, "row" :  row, "tddelete" : tddelete};
        }
    },
    
    Argelander : {
        CreateComparisonUIRow : function () {
            var table = CorrectorUIManager.table;
            var addChild = CorrectorUIManager.Utils.AddChild;
            
            var row = addChild (table, "tr");
            var tdbright =  addChild (row, "td");
            var brightInput = addChild (tdbright, "input");
            var tdval =  addChild (row, "td");
            var compImput = addChild (tdval, "input");
            var tddim =  addChild (row, "td");
            var dimInput = addChild (tddim, "input");
            var tddelete =  addChild (row, "td");
            
            compImput.size = 3;
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
			InputValidator.AddNumberMinimumValidator (compImput, 0);
            compImput.onfocus = function() { InputValidator.validate(this); }
            compImput.oninput = function() { this.onfocus(); CorrectorUIManager.onUserInput(); }
            compImput.placeholder = "[number]";
            compImput.onmouseenter = compImput.onfocus;
            
            var comp = ExtinctionCoefficient.SingleComparison(brightSelector, compImput, dimSelector);
            CorrectorUIManager.Utils.AddDeleteLink (row, tddelete, comp, ExtinctionCoefficient.comparisons);
            ExtinctionCoefficient.comparisons.push (comp);

            // set a ratings evaluation method.
            CorrectorUIManager.AddRatingIndicatorForExtinctionEstimate (comp, row);
        }
    },
    
    Paired : {
        CreateComparisonUIRow : function () {
            var table = CorrectorUIManager.table;
            var createdObj = CorrectorUIManager.Utils.AddPairedComparison (table);
            CorrectorUIManager.Utils.AddDeleteLink (createdObj.row, createdObj.tddelete, createdObj.comp, ExtinctionCoefficient.comparisons);
            ExtinctionCoefficient.comparisons.push (createdObj.comp);

            // set a ratings evaluation method.
            CorrectorUIManager.AddRatingIndicatorForExtinctionEstimate (createdObj.comp, createdObj.row);
        }
    },
    
    AddRatingIndicatorForExtinctionEstimate : function (comp, row) {
               var addChild = CorrectorUIManager.Utils.AddChild; 
               (function(){
                var tdRating = addChild (row, "td");
                var div = addChild (tdRating, "div");
                div.className = "norating";
                
                comp["updateRating"] = function() {
                    if (!this.isValid())
                        return;
                    var ratingDiv = div;                    
                    var originalComps = ExtinctionCoefficient.comparisons;
                    var myLocation = originalComps.indexOf(this);
                    if (myLocation < 0)
                   	    return;
                   
                    var kVals = ExtinctionCoefficient.rebuildValues();
                    var compsWithoutMe = originalComps.slice (0, myLocation).concat(originalComps.slice (myLocation+1, originalComps.length));
                    ExtinctionCoefficient.comparisons = compsWithoutMe;
                    var kvalsWOMe =   ExtinctionCoefficient.rebuildValues();
                    ExtinctionCoefficient.comparisons = originalComps;
                   
                    var statsWithMe = Computations.AverageAndStdDev (kVals);
                    var statsWOMe = Computations.AverageAndStdDev (kvalsWOMe);
                    
                    var ratingLabels = [ "sad", "meh", "happy"];
                    var rating = Computations.CompareStats (statsWOMe, statsWithMe, {"avgStdDevRatio" : 0.5, "stdDevAbsError" : 0.05, "stdDevMaxAbsError" : 0.1} );                    
                    ratingDiv.className = ratingLabels [rating];
                }
            })();
    }, 
    
    onLocationOrTimeChanged : function () {
        try {
            // update all airmasses
            var latitude = Computations.evalNum (document.getElementById ("lat").value);
            var longitude = Computations.evalNum (document.getElementById ("long").value);
            var timeString = document.getElementById ("dateTime").value;
            var lst = Computations.LSTFromTimeString (timeString, longitude);
        } catch (err) {
        }
            
        try {
            // update the variable comparison aimass,
            var comps = EstimationCorrector.pairedComparisons;
            var i = 0;
            for (i = 0; i < comps.length; i++) {
                ExtinctionCoefficient.updateAirmassForComparison(comps[i], latitude, longitude, lst);
            }
            // display the airmasses
        } catch (err) {
        }
            
        try {
            ExtinctionCoefficient.updateAirmass (latitude, longitude, timeString);
            // then call the user input callbavck
        } catch (err) {
        }
        
        try {
            CorrectorUIManager.onUserInput();
        } catch (err) {
        }
    },
    
    onUserInput : function () {
        
        var coeffInput = document.getElementById ("K");
        
        try {
        
            try {
                EstimationCorrector.update();
            } catch (err) {
            }

            // this is the main callback ...
            // compute estimate with K = 0
            var K = 0;
            var variableBrightness = 0;
            try {
                var variableBrightnessArr = EstimationCorrector.Estimate (K);
                var variableMagStats = Computations.AverageAndStdDev (variableBrightnessArr);
                document.getElementById("brightnessNoExtinction").textContent = Computations.Round (variableMagStats.avg, 2) + 
                                                                                " (std. dev. " + 
                                                                                Computations.Round (variableMagStats.stdDev, 2) + 
                                                                                ")";
            } catch (err) {
            }
            
            try {
                // update airmass of V - it never gets selected by the user
                EstimationCorrector.updateAirmassFromInput (PhotmetryTable.variableStar);
            } catch (err) {
            }
            
            // display airmasses
            var airmassA = "unknown";
            var airmassB = "unknown";
            var airmassV = "unknown";
            try {
                airmassA =  EstimationCorrector.pairedComparisons[0].first.bright().airmass;
            } catch (err) {
                airmassA = "unknown";
            }

            try {
                airmassB = EstimationCorrector.pairedComparisons[0].second.dim().airmass;
            } catch (err) {
                airmassB = "unknown";
            }

            try {
                airmassV = EstimationCorrector.pairedComparisons[0].first.dim().airmass;
            } catch (err) {
                airmassV = "unknown";
            }
            
            document.getElementById ("airmassV").textContent = Computations.Round (airmassV, 3);
            
            var extinctionCorrectionRequired = Math.abs (airmassA - airmassB) > 0.2 ||
                                               Math.abs (airmassA - airmassV) > 0.2 ||
                                               Math.abs (airmassV - airmassB) > 0.2;
            if (extinctionCorrectionRequired)
                document.getElementById ("shouldComputeExtinction").className = "hidden";
            else
                document.getElementById ("shouldComputeExtinction").className = "";
            
            var variableBrightnessArr = [];
            // get K:
            //  - this can be a constant
            if (document.getElementById ("useValueForK").checked) {
                coeffInput.readOnly = false;
                K = parseFloat (coeffInput.value);
                
                try {
                    variableBrightnessArr = EstimationCorrector.Estimate (K);
                } catch (err) {
                }
            } else {
            //  - or it must be determined from observations
                coeffInput.readOnly = true;
                var kvals = ExtinctionCoefficient.rebuildValues();

                var kstats = Computations.AverageAndStdDev (kvals);
                coeffInput.value = Computations.Round (kstats.avg, 4);
                
                InputValidator.validate (coeffInput);

                var i = 0;
                for (i = 0; i < kvals.length; i++) {
                    variableBrightnessArr = variableBrightnessArr.concat (EstimationCorrector.Estimate (kvals[i]));
                }
            }
            
            var variableMagStats = Computations.AverageAndStdDev (variableBrightnessArr);
            document.getElementById("brightnessWithExtinction").textContent = Computations.Round (variableMagStats.avg, 2) + 
                                                                              " (std. dev. " + 
                                                                              Computations.Round (variableMagStats.stdDev, 2) + 
                                                                              ")";
            
        } catch (err) {
        }
        ExtinctionCoefficient.updateUI();
        DataShareSave.update();
    }
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
