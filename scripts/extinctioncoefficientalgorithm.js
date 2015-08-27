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

var ExtinctionCoefficient = {

    comparisons : [],
    
    validValuesRange : [0.0 , 10.0],
    
    algorithms : ["Argelander", "Paired"],
    currentAlgorithmID : 0,

    updateAirmass : function (_lat, _long, _time){
        
        var lst = Computations.LSTFromTimeString (_time, _long);
        
        var compIndex = 0;
        var comps = ExtinctionCoefficient.comparisons;
        for (compIndex = 0; compIndex < comps.length; compIndex++) {
            ExtinctionCoefficient.updateAirmassForComparison(comps[compIndex], _lat, _long, lst);
        }
    },
    
    updateAirmassForComparison : function (comp, _lat, _long, lst) {
        if (!comp)
            return;
        var stars = comp.getStars();
        var starIndex = 0;
        for (starIndex = 0; starIndex < stars.length; starIndex++) {
            ExtinctionCoefficient.updateAirmassForStar (stars[starIndex], _lat, _long, lst);
        }
    },
    
    updateAirmassForStar : function (star,  _lat, _long, lst) {
        if (!star)
            return;
        // for each star, compute altitude
        var alt = Computations.Alt (star.ra, star.dec, lst, _lat, _long);
        // then airmass
        if (isNaN (alt))
            return;
        star.airmass = Computations.Airmass (alt);
    },
    
    rebuildValues : function () {
        if (ExtinctionCoefficient.currentAlgorithmID < 0 || ExtinctionCoefficient.currentAlgorithmID > ExtinctionCoefficient.algorithms.length)
            throw "invalid algorithm selected";
        
        var algo = ExtinctionCoefficient.algorithms[ExtinctionCoefficient.currentAlgorithmID];
        var values_beforeFilter = ExtinctionCoefficient[algo].getKValues();
        
        if (values_beforeFilter.length == 0)
            return 0;
                
        var i = 0;
        var usedValues = [];
        for (i = 0; i < values_beforeFilter.length; i++) {
            if (values_beforeFilter[i] > ExtinctionCoefficient.validValuesRange [0] && 
                values_beforeFilter[i] < ExtinctionCoefficient.validValuesRange [1]) {
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
            return ExtinctionCoefficient.getkValueFromSingleComparison (firstSingleComparison);
        
        if (secondSingleComparison.value() == 0) 
            return ExtinctionCoefficient.getkValueFromSingleComparison (secondSingleComparison);
        
        var a = firstSingleComparison.value() * (secondSingleComparison.bright().mag - secondSingleComparison.dim().mag);
        var b = secondSingleComparison.value() * (firstSingleComparison.bright().mag - firstSingleComparison.dim().mag);
                        
        var c = secondSingleComparison.value() * (firstSingleComparison.bright().airmass - firstSingleComparison.dim().airmass);
        var d = firstSingleComparison.value() * (secondSingleComparison.bright().airmass - secondSingleComparison.dim().airmass);
        return ((a - b) / (c - d));
           
    },
    
    getValidComparisons : function () {
        var initial_comps = ExtinctionCoefficient.comparisons; // avoid long names
        var comps = [];
            
        var i = 0;
        for (i = 0; i < initial_comps.length; i++)
            if (initial_comps[i].isValid())
                comps.push (initial_comps[i]);
        
        return comps;
    },

    SingleComparison : function (brighterStarSelector, degreesEditor, dimmerStarSelector) {
        return (function () {
            var b = brighterStarSelector;
            var deg = degreesEditor;
            var d = dimmerStarSelector;
            InputValidator.AddNumberMinimumValidator (deg, 0);
            deg.oninput = function () { InputValidator.validate(this); CorrectorUIManager.onUserInput(); };
            
            return {
                "bright" : function () { return this.ui.brightSelector.get(); },
                "value" : function () { return Computations.evalNum(this.ui.valueLineEdit.value); } ,
                "dim" : function () { return this.ui.dimSelector.get(); },
                "ui" : {
                    "brightSelector" : b,
                    "valueLineEdit" : deg,
                    "dimSelector" : d
                },
                
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
                
                "getStars" : function () {
                    return [this.bright(), this.dim()];
                },
                
                "updateUI" : function () {
                    this.ui.brightSelector.update();
                    this.ui.dimSelector.update();
                }
            };
        })();
    },

    PairedComparison : function (brighterStarSelector, b2m_editor, midStarSelector, m2d_editor, dimStarSelector) {
        return (function () {
            var b = brighterStarSelector;
            var deg1 = b2m_editor;
            var m = midStarSelector;
            var deg2 = m2d_editor;
            var d = dimStarSelector;
            
            return {
                "first" : ExtinctionCoefficient.SingleComparison (b, deg1, m),
                "second" : ExtinctionCoefficient.SingleComparison (m, deg2, d),
                "isValid" : function () {
                    return this.first.isValid() && this.second.isValid();
                },
                "getStars" : function () {
                    return ((this.first.getStars()).concat(this.second.getStars()));
                },
                "updateUI" : function () {
                    this.first.updateUI();
                    this.second.updateUI();
                }
            };
        })();
    },
    
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
                    bracketCompInput.value = Computations.evalNum(pairedComp.first.value) + Computations.evalNum(pairedComp.second.value);
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
    
    updateUI : function () {
        var i = 0;
        var comps = ExtinctionCoefficient.comparisons; // avoid long names
        for (; i < comps.length; i++) {
            comps[i].updateUI();
            comps[i].updateRating();
        }
    }


};
