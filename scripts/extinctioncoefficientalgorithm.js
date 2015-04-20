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

    values : [],
    comparisons : [],
    
    useMedianRatio : 1.0 / 3.0, 
    
    algorithms : ["Argelander", "Paired"],
    currentAlgorithmID : 0,
        
    getAverageValue : function () {
        
        if (ExtinctionCoefficient.currentAlgorithmID < 0 || ExtinctionCoefficient.currentAlgorithmID > ExtinctionCoefficient.algorithms.length)
            throw "invalid algorithm selected";
        
        var algo = ExtinctionCoefficient.algorithms[ExtinctionCoefficient.currentAlgorithmID];
        ExtinctionCoefficient.values = ExtinctionCoefficient[algo].getKValues();
        
        ExtinctionCoefficient.values.sort ( function (a, b) { return a - b; } );
        int allowedEntries = Math.floor (ExtinctionCoefficient.values.length * ExtinctionCoefficient.useMedianRatio);
        if (allowedEntries) {
            var startSlicingFrom = Math.floor((ExtinctionCoefficient.values.length - allowedEntries)/2)
            ExtinctionCoefficient.values.slice = ExtinctionCoefficient.values.slice (startSlicingFrom, startSlicingFrom + allowedEntries);
        }
        var returnedCoeff = 0;
        var i = 0;
        for (i = 0; i < ExtinctionCoefficient.values.length; i++)
            returnedCoeff = returnedCoeff + ExtinctionCoefficient.values[i];
            
        returnedCoeff = returnedCoeff / ExtinctionCoefficient.values.length;
        return returnedCoeff;
    },
    
    getkValue : function (firstSingleComparison, secondSingleComparison) {
            
        var a = firstSingleComparison.value * (secondSingleComparison.bright.mag - secondSingleComparison.dim.mag);
        var b = secondSingleComparison.value * (firstSingleComparison.bright.mag - firstSingleComparison.dim.mag);
                        
        var c = secondSingleComparison.value * (firstSingleComparison.bright.airmass - firstSingleComparison.dim.airmass);
        var d = firstSingleComparison.value * (secondSingleComparison.bright.airmass - secondSingleComparison.dim.airmass);
        return ((a - b) / (c - d));
           
    },

    SingleComparison : function (brighterStar, degrees, dimmerStar) {
        return function () {
            var b = brighterStar;
            var deg = degrees;
            var d = dimmerStar;
            
            return {
                "bright" : b,
                "value" : deg,
                "dim" : d
            };
        }();
    },

    PairedComparison : function (brightStar, b2m, midStar, m2d, dimStar) {
        return function () {
            var b = brighterStar;
            var deg1 = b2m;
            var m = midStar;
            var deg2 = m2d;
            var d = dimStar;
            
            return {
                "first" : ExtinctionCoefficient.SingleComparison (b, deg1, m),
                "second" : ExtinctionCoefficient.SingleComparison (m, deg2, d)
            };
        }();
    },
    
    Argelander : {
        /** used to get an array of K constants. Assumes all comparisons are of single type */
        getKValues : function () {
            /* n^2 complexity */
            var kvals = [];
            var firstComparison = 0;
            var secondComparison = 0;
            var comps = ExtinctionCoefficient.comparisons; // avoid long names
            for (; firstComparison < comps.length; firstComparison++) {
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
            var comps = ExtinctionCoefficient.comparisons; // avoid long names
            var i = 0;
            for (; i < comps.length; i++) {
                function (n) {
                    var pairedComp =  comps[n];
                    var bracketComp = ExtinctionCoefficient.SingleComparison (pairedComp.first.bright, 
                                                                              pairedComp.first.value + pairedComp.second.value, 
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
                }(i);
            }
            return kvals;
        }
    }


};
