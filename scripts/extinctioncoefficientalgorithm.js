// JavaScript Document

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
            return {
                "bright" : brighterStar,
                "value" : degrees,
                "dim" : dimmerStar
            };
        }();
    },

    PairedComparison : function (brightStar, b2m, midStar, m2d, dimStar) {
        return function () {
            return {
                "first" : ExtinctionCoefficient.SingleComparison (brightStar, b2m, midStar),
                "second" : ExtinctionCoefficient.SingleComparison (midStar, m2d, dimStar)
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
