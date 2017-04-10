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

/* model side logic, with some control elements */

var ExtinctionCoefficient = {

// this is the model side.
// keeps all comparisons that are used to compute K
    comparisons : [],
    
    validValuesRange : [0.0 , 10.0],
    
    algorithms : ["Argelander", "Paired"],
    currentAlgorithmID : 0,

    updateAirmass : function (lat, long, lst){
        var compIndex = 0;
        var comps = this.comparisons;
        for (compIndex = 0; compIndex < comps.length; compIndex++) {
            this.updateAirmassForComparison(comps[compIndex], lat, long, lst);
        }
    },
    
    updateAirmassForComparison : function (comp, lat, long, lst) {
        if (!comp)
            return;
        var stars = comp.getStars();
        var starIndex = 0;
        for (starIndex = 0; starIndex < stars.length; starIndex++) {
            stars[starIndex].updateAirmass(lat, long, lst);
        }
    },
    
    rebuildValues : function () {
        if (this.currentAlgorithmID < 0 || this.currentAlgorithmID > this.algorithms.length)
            throw "invalid algorithm selected";
        
        var algo = this.algorithms[this.currentAlgorithmID];
        var values_beforeFilter = this[algo].getKValues();
        
        if (values_beforeFilter.length == 0)
            return 0;
                
        var i = 0;
        var usedValues = [];
        for (i = 0; i < values_beforeFilter.length; i++) {
            if (values_beforeFilter[i] > this.validValuesRange [0] && 
                values_beforeFilter[i] < this.validValuesRange [1]) {
                usedValues.push (values_beforeFilter[i]);
            }
        }
        
        return usedValues;
    },
    
    getkValueFromSingleComparison : function (comparison) {
        return Math.abs(comparison.bright().mag - comparison.dim().mag) / 
               Math.abs(comparison.bright().airmass - comparison.dim().airmass);
    },
    
    getkValue : function (firstSingleComparison, secondSingleComparison) {
        
        if (firstSingleComparison.value() == 0)
            return this.getkValueFromSingleComparison (firstSingleComparison);
        
        if (secondSingleComparison.value() == 0) 
            return this.getkValueFromSingleComparison (secondSingleComparison);
        
        var a = firstSingleComparison.value() * (secondSingleComparison.bright().mag - secondSingleComparison.dim().mag);
        var b = secondSingleComparison.value() * (firstSingleComparison.bright().mag - firstSingleComparison.dim().mag);
                        
        var c = secondSingleComparison.value() * (firstSingleComparison.bright().airmass - firstSingleComparison.dim().airmass);
        var d = firstSingleComparison.value() * (secondSingleComparison.bright().airmass - secondSingleComparison.dim().airmass);
        return ((a - b) / (c - d));
           
    },
    
    getValidComparisons : function () {
        var initial_comps = this.comparisons; // avoid long names
        var comps = [];
            
        var i = 0;
        for (i = 0; i < initial_comps.length; i++)
            if (initial_comps[i].isValid())
                comps.push (initial_comps[i]);
        
        return comps;
    },

    /* mostly control side, but has view elements */
    SingleComparison : function (brighterStarSelector, degreesEditor, dimmerStarSelector) {
        return (function () {
            var b = brighterStarSelector;
            var deg = degreesEditor;
            var d = dimmerStarSelector;
			var compChanged = Notifications.NewNoParameter();
			compChanged.add(CorrectorUIManager.onUserInput);

            InputValidator.AddNumberMinimumValidator (deg, 0);
            deg.onfocus = function () { InputValidator.validate(this); }
            deg.oninput = function () { this.onfocus(); compChanged.notify(); };
            deg.onmuseenter = deg.onfocus;
			
			StarsSelection.afterStarSelection.add (function (sel, star) {
				if (sel == b || sel == d)
					compChanged.notify();
			});
            
            return {
				//! returns the star selected as bright
                "bright" : function () { return this.ui.brightSelector.get(); },
				//! returns the number of brightness steps between the two stars
                "value" : function () { return Computations.evalNum(this.ui.valueLineEdit.value); } ,
                //! returns the star selected as dim
				"dim" : function () { return this.ui.dimSelector.get(); },
                "ui" : {
                    "brightSelector" : b,
                    "valueLineEdit" : deg,
                    "dimSelector" : d
                },
                //! returns true if the comparison is valid (all star selection fields set,
				//! and all brightness steps filled in)
                "isValid" : function () {
                    var valid = false;
                    try {
                        this.value();
                        valid = (null != this.bright() && null != this.dim() && 
                                this.ui.valueLineEdit.value != "");
                    } catch (err) {
                    }
                    return valid;
                },
                //! Returns all stars used by this comparison
                "getStars" : function () {
                    return [this.bright(), this.dim()];
                },
 				//! Does what says on the box - updates the UI               
                "updateUI" : function () {
                    this.ui.brightSelector.update();
                    this.ui.dimSelector.update();
                },
				//! notification when either the selected stars
				//! or the brightness between them is changed.
				"onComparisonChanged" : compChanged
            };
        })();
    },

    /* mostly control side, but has view elements */
    PairedComparison : function (brighterStarSelector, b2m_editor, midStarSelector, m2d_editor, dimStarSelector) {
        return (function () {
            var b = brighterStarSelector;
            var deg1 = b2m_editor;
            var m = midStarSelector;
            var deg2 = m2d_editor;
            var d = dimStarSelector;
			
			var _first = ExtinctionCoefficient.SingleComparison (b, deg1, m);
			var _second = ExtinctionCoefficient.SingleComparison (m, deg2, d);
			
			var compChanged = Notifications.NewNoParameter();
			_first.onComparisonChanged.add (compChanged.notify);
			_second.onComparisonChanged.add (compChanged.notify);
            
            return {
				//! the first simple comparison (bright to mid)
                "first" : _first,
				//! the second comparison - mid to dim stars
                "second" : _second,
				//! returns true if the comparison is valid (all star selection fields set,
				//! and all brightness steps filled in)
                "isValid" : function () {
                    return this.first.isValid() && this.second.isValid();
                },
				//! Returns all stars used by this comparison
                "getStars" : function () {
                    return ((this.first.getStars()).concat(this.second.getStars()));
                },
				//! Does what says on the box - updates the UI
                "updateUI" : function () {
                    this.first.updateUI();
                    this.second.updateUI();
                },
				//! notification when either the selected stars
				//! or the brightness between them is changed.
				"onComparisonChanged" : compChanged
            };
        })();
    },
    
    // algo, model side
    Argelander : {
        /** used to get an array of K constants. Assumes all comparisons are of single type */
        getKValues : function () {
            /* n^2 complexity */
            var kvals = [];
            var comps = ExtinctionCoefficient.getValidComparisons();
            
            var firstComparison = 0;
            var secondComparison = 0;
            
            for (; firstComparison < comps.length; firstComparison++) {
                if (comps[firstComparison].value() == 0) {
                    kvals.push (ExtinctionCoefficient.getkValueFromSingleComparison (comps[firstComparison]));
                    continue;
                }
                for (secondComparison = firstComparison + 1; secondComparison < comps.length; secondComparison++) {
                    try {
                        kvals.push (ExtinctionCoefficient.getkValue (comps[firstComparison], comps[secondComparison]));
                    } catch (err) { // div by 0 
                    }
                }
            }
            return kvals;
        }
    },
    
    // algo, model side
    Paired : {
        /** used to get an array of K constants. Assumes all comparisons are of paired type */
        getKValues : function () {
            var kvals = [];
            // each paired comparison gives 3 values for k
            var comps = ExtinctionCoefficient.getValidComparisons(); // avoid long names
            var i = 0;
            for (; i < comps.length; i++) {
                (function (n) {
                    var pairedComp =  comps[n];
                    
                    var bracketCompInput = document.createElement ("input");
                    bracketCompInput.style.display = "none";
                    bracketCompInput.value = (function () { var val = Computations.evalNum(pairedComp.first.value()) + Computations.evalNum(pairedComp.second.value()); return val;} ());
                    var bracketComp = ExtinctionCoefficient.SingleComparison (pairedComp.first.bright, 
                                                                              bracketCompInput, 
                                                                              pairedComp.second.dim);
                    try {
                        kvals.push (ExtinctionCoefficient.getkValue (pairedComp.first, pairedComp.second));
                    } catch (err) { // div by 0 
                    }

                    try {
                        kvals.push (ExtinctionCoefficient.getkValue (bracketComp, pairedComp.first));
                    } catch (err) { // div by 0 
                    }

                    try {
                        kvals.push (ExtinctionCoefficient.getkValue (bracketComp, pairedComp.second));
                    } catch (err) { // div by 0 
                    }
                    delete bracketCompInput;
                })(i);
            }
            return kvals;
        }
    },
    
    // controller side.
    updateUI : function () {
        var i = 0;
        var comps = this.comparisons; // avoid long names
        for (; i < comps.length; i++) {
            comps[i].updateUI();
            comps[i].updateRating();
        }
    }


};

try {
    Initialization.init();
} catch (err) {
}
