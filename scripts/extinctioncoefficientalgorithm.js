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

var ExtinctionCoefficient = {

    comparisons : [],
    
    validValuesRange : [0.15 , 1.0],
    
    useMedianRatio : 1.0 / 1.0, 
    
    algorithms : ["Argelander", "Paired"],
    currentAlgorithmID : 0,

    updateAirmass : function (_lat, _long, _time){
        
        var lst = Computations.LSTFromTimeString (_time, _long);
        
        var compIndex = 0;
        var comps = ExtinctionCoefficient.getValidComparisons();
        for (compIndex = 0; compIndex < comps.length; compIndex++) {
            ExtinctionCoefficient.updateAirmassForComparison(comps[compIndex], _lat, _long, lst);
        }
    },
    
    updateAirmassForComparison : function (comp, _lat, _long, lst) {
        var stars = comp.getStars();
        var starIndex = 0;
        for (starIndex = 0; starIndex < stars.length; starIndex++) {
            ExtinctionCoefficient.updateAirmassForStar (stars[starIndex], _lat, _long, lst);
        }
    },
    
    updateAirmassForStar : function (star,  _lat, _long, lst) {
        // for each star, compute altitude
        var alt = Computations.Alt (star.ra, star.dec, lst, _lat, _long);
        // then airmass
        star.airmass = Computations.Airmass (alt);
    },
    
    getAverageValue : function () {
        
        if (ExtinctionCoefficient.currentAlgorithmID < 0 || ExtinctionCoefficient.currentAlgorithmID > ExtinctionCoefficient.algorithms.length)
            throw "invalid algorithm selected";
        
        var algo = ExtinctionCoefficient.algorithms[ExtinctionCoefficient.currentAlgorithmID];
        var values = ExtinctionCoefficient[algo].getKValues();
        
        if (values.length == 0)
            return 0;
        
        values.sort ( function (a, b) { return a - b; } );
        var allowedEntries = Math.floor (values.length * ExtinctionCoefficient.useMedianRatio);
        if (allowedEntries) {
            var startSlicingFrom = Math.floor((values.length - allowedEntries)/2)
            values = values.slice (startSlicingFrom, startSlicingFrom + allowedEntries);
        }
        var returnedCoeff = 0;
        var i = 0;
        var usedValues = 0;
        for (i = 0; i < values.length; i++) {
            if (values[i] > ExtinctionCoefficient.validValuesRange [0] && values[i] < ExtinctionCoefficient.validValuesRange [1]) {
                returnedCoeff = returnedCoeff + values[i];
                usedValues++;
            }
        }
        
        if (usedValues > 0)
            returnedCoeff = returnedCoeff / usedValues;
        
        return returnedCoeff;
    },
    
    getkValue : function (firstSingleComparison, secondSingleComparison) {
            
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
        return function () {
            var b = brighterStarSelector;
            var deg = degreesEditor;
            var d = dimmerStarSelector;
            
            deg.oninput = function () { CorrectorUIManager.onUserInput() };
            
            return {
                "bright" : function () { return this.ui.brightSelector.get(); },
                "value" : function () { return eval(this.ui.valueLineEdit.value); } ,
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
                }
            };
        }();
    },

    PairedComparison : function (brighterStarSelector, b2m_editor, midStarSelector, m2d_editor, dimStarSelector) {
        return function () {
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
                }
            };
        }();
    },
    
    Argelander : {
        /** used to get an array of K constants. Assumes all comparisons are of single type */
        getKValues : function () {
            /* n^2 complexity */
            var kvals = [];
            var comps = ExtinctionCoefficient.getValidComparisons();
            
            var firstComparison = 0;
            var secondComparison = 0;
            
            for (; firstComparison < comps.length && comps.length > 1; firstComparison++) {
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
                    bracketCompInput.value = eval(pairedComp.first.value) + eval(pairedComp.second.value);
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
    }


};
