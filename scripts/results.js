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

var Results = {
	
	brightnessNoExtinction : document.getElementById("brightnessNoExtinction"),
	brightnessWithExtinction : document.getElementById("brightnessWithExtinction"),
	airmassV : document.getElementById("airmassV"),
	shouldComputeExtinction : document.getElementById("shouldComputeExtinction"),
	
    onLocationOrTimeChanged : function () {
		var latitude = 0;
		var longitude = 0;
		var timeString = "";
		var lst = 0;
		
        try {
            latitude = Computations.evalNum (document.getElementById ("lat").value);
            longitude = Computations.evalNum (document.getElementById ("long").value);
            timeString = document.getElementById ("dateTime").value;
            lst = Computations.LSTFromTimeString (timeString, longitude);
        } catch (err) {
        }
            
        // update all airmasses
        try {
            // update the variable comparison aimass,
            var comps = EstimationCorrector.pairedComparisons;
            var i = 0;
            for (i = 0; i < comps.length; i++) {
                ExtinctionCoefficient.updateAirmassForComparison(comps[i], latitude, longitude, lst);
            }
        } catch (err) {
        }
            
        try {
            ExtinctionCoefficient.updateAirmass (latitude, longitude, timeString);
        } catch (err) {
        }
		
		try {
			PhotmetryTable.variableStar.updateAirmass(latitude, longitude, lst);
		}catch (err) {
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
            try {
                var variableBrightnessArr = EstimationCorrector.Estimate (K);
                var variableMagStats = Computations.AverageAndStdDev (variableBrightnessArr);
                Results.brightnessNoExtinction.textContent = Computations.Round (variableMagStats.avg, 2) + 
                                                                                " (std. dev. " + 
                                                                                Computations.Round (variableMagStats.stdDev, 2) + 
                                                                                ")";
            } catch (err) {
            }
            
            try {
                // update airmass of V - it never gets selected by the user
                // EstimationCorrector.updateAirmassFromInput (PhotmetryTable.variableStar);
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
            
            Results.airmassV.textContent = Computations.Round (airmassV, 3);
            
            var extinctionCorrectionRequired = Math.abs (airmassA - airmassB) > 0.2 ||
                                               Math.abs (airmassA - airmassV) > 0.2 ||
                                               Math.abs (airmassV - airmassB) > 0.2;
            if (extinctionCorrectionRequired)
                Results.shouldComputeExtinction.className = "hidden";
            else
                Results.shouldComputeExtinction.className = "";
            
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
            Results.brightnessWithExtinction.textContent = Computations.Round (variableMagStats.avg, 2) + 
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
