/*
Extinction-O-Meter - an HTML & JavaScript utility to apply differential 
extinction corrections to brightness estimates
               
Copyright 2015  Herr_Alien <alexandru.garofide@gmail.com>
                
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
        for (i = 0; i < this.pairedComparisons.length; i++) {
			var pairedComparison = this.pairedComparisons[i];
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
        this.pairedComparisons = [];
		// empty the table of estimates ...
		var table = CorrectorUIManager.extraEstimatesTable;
		while (table.hasChildNodes())
			table.removeChild (table.firstChild);
		// add the first estimate
        this.addNewComparison ();

		// reset the estimates for extinction
		CorrectorUIManager.ClearComparisonsList();
        CorrectorTableView.ResetHeader();	
		CorrectorUIManager.useArgelander.onclick();
        CorrectorUIManager.useArgelander.checked = true;
    },
    
    updateAirmassFromInput : function (star) {
        star.updateAirmass(Location.latitude, Location.longitude, Location.lst);
    },
    
    // this is a control side of things.
    addNewComparison : function () {
		// this is view-ish ... should not be here.
        var table = CorrectorUIManager.extraEstimatesTable;
        var createdObj = CorrectorUIManager.Utils.AddPairedComparison (table);
        CorrectorUIManager.Utils.AddDeleteLink (createdObj.row, createdObj.tddelete, createdObj.comp, EstimationCorrector.pairedComparisons);

        createdObj.midSelector.set (PhotmetryTable.variableStar);
        createdObj.midSelector.show (false);

        this.pairedComparisons.push (createdObj.comp);
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
        for (i = 0; i < this.pairedComparisons.length; i++) {
            var pairedComparison = this.pairedComparisons[i];
            pairedComparison.updateUI();
			try {
				pairedComparison.updateRating();
			} catch (err) {
				;
			}
        }
    
    }
};

var CorrectorTableView = {
	// should contain the table
    table : document.getElementById("extinctionEstimates"),
    tableHeader : document.getElementById("extinctionEstimatesHeader"),
	
	// should probably be in CorrectorTableView
	// should be called from a notification (algo change)
    ResetHeader : function () {
        var addChild = CorrectorUIManager.Utils.AddChild;
        CorrectorUIManager.Utils.ClearDOM(this.tableHeader);
        if (0 == CorrectorUIManager.selectedAlgorithm) {
            var tdbright =  addChild (this.tableHeader, "td");
            var tdval =  addChild (this.tableHeader, "td");
            var tddim =  addChild (this.tableHeader, "td");

            tdbright.textContent = "Bright star"; 
            tddim.textContent = "Dim star"; 
            tdval.textContent = "steps"; 
        } else {
            var tdbright =  addChild (this.tableHeader, "td");
            var tdval_bm =  addChild (this.tableHeader, "td");
            var tdmid =  addChild (this.tableHeader, "td");
            var tdval_md =  addChild (this.tableHeader, "td");
            var tddim =  addChild (this.tableHeader, "td");

            tdbright.textContent = "Bright star"; 
            tdval_bm.textContent = "steps"; 
            tddim.textContent = "Dim star"; 
            tdval_md.textContent = "steps"; 
            tdmid.textContent = "Middle star"; 
        }

		// set up a destination for the add link
        var tdadd =  addChild (this.tableHeader, "td");
		// have the control create the link
        CorrectorUIManager.createAddAnchor (tdadd);

		// add a column for the rating view.
        var tdRating = addChild (this.tableHeader, "td");
        tdRating.style["background"] = "#ffffff";
        CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow(); // one compariso is enough for pairs
        if (0 == CorrectorUIManager.selectedAlgorithm)
            CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow(); // two, for Argelander
    },
	
	// function to add the argerlander row here
	// and function to add the paired row here

};

// control, mostly
var CorrectorUIManager = {
	
	// should be split to a sepparate UI manager, for actual brightness estimates
    //table : document.getElementById("extinctionEstimates"),
    //tableHeader : document.getElementById("extinctionEstimatesHeader"), 
    
	// and only this should be the controller for the corrector.
    useValueForK : document.getElementById ("useValueForK"),
    computeK : document.getElementById ("computeK"),
    useArgelander : document.getElementById ("useArgelander"),
    usePaired : document.getElementById ("usePaired"),
    
    addVariableEstimateLink : document.getElementById ("addEstimateLink"),
    extraEstimatesTable : document.getElementById ("extraEstimates"), 
    
    selectedAlgorithm : 0,
	addRowAnchor : false,
	
	createAddAnchor : function (parentElem) {
		this.addRowAnchor = this.Utils.AddChild(parentElem, "a");
        this.addRowAnchor.textContent = "(+) Add row";
        this.addRowAnchor.noref="";
        this.addRowAnchor.className = "addAnchor";
        this.addRowAnchor.onclick = function () { // this should call notifications ...
            CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow();
        }
	},
	
	onSelectedArgelanderNotif : {},
	
	// should have a notification object for adding a correction entry
    
    init : function () {
		
		StarsSelection.afterStarSelection.add (this.onUserInput);
		
        this.useValueForK.onclick = function () {
            CorrectorUIManager.computeK.checked = false;
            CorrectorUIManager.onUserInput();
        }
        this.computeK.onclick = function () {
            CorrectorUIManager.useValueForK.checked = false;
            CorrectorUIManager.onUserInput();
        }
        this.addVariableEstimateLink.onclick = function () {
            EstimationCorrector.addNewComparison ();
        }
        
		// this should be handled by an array of functions
        this.useArgelander.onclick = function () {
			// one handler ...
            CorrectorUIManager.usePaired.checked = false;
			// one handler ...
            CorrectorUIManager.selectedAlgorithm = 0;
			// one handler ...
            ExtinctionCoefficient.currentAlgorithmID = 0;
			// one handler ...
            CorrectorUIManager.ClearComparisonsList();
			// one handler ...
            CorrectorTableView.ResetHeader();
			// one handler ...
			// this one should just update the results view, with a K = 0 
			// or equal to the value from the input field.
            try{
            CorrectorUIManager.onUserInput();
            } catch (err) {}
        }
        this.usePaired.onclick = function () {
			// one handler ...
            CorrectorUIManager.useArgelander.checked = false;
			// one handler ...
            CorrectorUIManager.selectedAlgorithm = 1;
			// one handler ...
            ExtinctionCoefficient.currentAlgorithmID = 1;
			// one handler ...
            CorrectorUIManager.ClearComparisonsList();
			// one handler ...
            CorrectorTableView.ResetHeader();
			// one handler ...
			// this one should just update the results view, with a K = 0 
			// or equal to the value from the input field.
            try{
            CorrectorUIManager.onUserInput();
            } catch (err) {}
        }
        
        this.useArgelander.onclick();
        this.useArgelander.checked = true;
    },
    
    algorithms : ["Argelander", "Paired"],
    
    ClearComparisonsList : function () {
        ExtinctionCoefficient.comparisons = [];
		// this should be in view
        this.Utils.ClearDOM (CorrectorTableView.table);
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
            var addChild = this.AddChild;
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
            var addChild = this.AddChild;
            
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
            
           
		   b2m.className = "brightnessInput";
		   m2d.className = "brightnessInput";
		   
            b2m.placeholder = "[number]";
            m2d.placeholder = "[number]";
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var midSelector = StarsSelection.Selector.build (midImput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            
            // TODO: get notified about selection, to update stats.
            
			InputValidator.AddNumberMinimumValidator (b2m, 0);
			InputValidator.AddNumberMinimumValidator (m2d, 0);
			
            b2m.onfocus = function () {InputValidator.validate(this); }
            m2d.onfocus = function () {InputValidator.validate(this); }

            b2m.oninput = function () { this.onfocus(); CorrectorUIManager.onUserInput();}
            m2d.oninput = function () { this.onfocus(); CorrectorUIManager.onUserInput();}
            
            b2m.onmouseenter = b2m.onfocus;
            m2d.onmouseenter = m2d.onfocus;

            var comp = ExtinctionCoefficient.PairedComparison(brightSelector, b2m, midSelector, m2d, dimSelector);
			// this is the view object.
			// should interrogate the model side (the comp object) when being notified by the controller
            return { "comp": comp, "midSelector" : midSelector, "tdmid" : tdmid, "row" :  row, "tddelete" : tddelete};
        }
    },
    
    Argelander : {
		// should be a notif. handler
        CreateComparisonUIRow : function () {
            var table = CorrectorTableView.table;
            var addChild = CorrectorUIManager.Utils.AddChild;
            
            var row = addChild (table, "tr");
            var tdbright =  addChild (row, "td");
            var brightInput = addChild (tdbright, "input");
            var tdval =  addChild (row, "td");
            var compImput = addChild (tdval, "input");
            var tddim =  addChild (row, "td");
            var dimInput = addChild (tddim, "input");
            var tddelete =  addChild (row, "td");
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
			InputValidator.AddNumberMinimumValidator (compImput, 0);
			
			compImput.className = "brightnessInput";
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
		// should be a notif. handler
        CreateComparisonUIRow : function () {
            var table = CorrectorTableView.table;
            var createdObj = CorrectorUIManager.Utils.AddPairedComparison (table);
            CorrectorUIManager.Utils.AddDeleteLink (createdObj.row, createdObj.tddelete, createdObj.comp, ExtinctionCoefficient.comparisons);
            ExtinctionCoefficient.comparisons.push (createdObj.comp);

            // set a ratings evaluation method.
            CorrectorUIManager.AddRatingIndicatorForExtinctionEstimate (createdObj.comp, createdObj.row);
        }
    },
    
    AddRatingIndicatorForExtinctionEstimate : function (comp, row) {
               var addChild = this.Utils.AddChild; 
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
        Results.onLocationOrTimeChanged();
    },
    
    onUserInput : function () {
        Results.onUserInput();
    }
};

try {
    Initialization.init();
} catch (err) {
}
