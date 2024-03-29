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

var Results = {
	
	brightnessNoExtinction : document.getElementById("brightnessNoExtinction"),
	brightnessWithExtinction : document.getElementById("brightnessWithExtinction"),
	airmassV : document.getElementById("airmassV"),
	shouldComputeExtinction : document.getElementById("shouldComputeExtinction"),
	
    onLocationOrTimeChanged : function () {
		var latitude = Location.latitude;
		var longitude = Location.longitude;
		var lst = Location.lst;
		
        // update all airmasses
        try {
            // update the variable comparison aimass,
            var comps = EstimationCorrector.Model.pairedComparisons;
            var i = 0;
            for (i = 0; i < comps.length; i++) {
                ExtinctionCoefficient.updateAirmassForComparison(comps[i], latitude, longitude, lst);
            }
        } catch (err) {
        }
            
        try {
            ExtinctionCoefficient.updateAirmass (latitude, longitude, lst);
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
                var variableBrightnessArr = EstimationCorrector.Model.Estimate (K);
                var variableMagStats = Computations.AverageAndStdDev (variableBrightnessArr);
                Results.brightnessNoExtinction.textContent = Computations.Round (variableMagStats.avg, 2) + 
                                                                                " (std. dev. " + 
                                                                                Computations.Round (variableMagStats.stdDev, 2) + 
                                                                                ")";
            } catch (err) {
            }
            
			// this is no longer relevant - you may have more than one brightness estimate ...
            // display airmasses
            var airmassA = "unknown";
            var airmassB = "unknown";
            var airmassV = "unknown";
            try {
                airmassA =  EstimationCorrector.Model.pairedComparisons[0].first.bright().airmass;
            } catch (err) {
                airmassA = "unknown";
            }

            try {
                airmassB = EstimationCorrector.Model.pairedComparisons[0].second.dim().airmass;
            } catch (err) {
                airmassB = "unknown";
            }

            try {
                airmassV = EstimationCorrector.Model.pairedComparisons[0].first.dim().airmass;
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
                    variableBrightnessArr = EstimationCorrector.Model.Estimate (K);
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
                    variableBrightnessArr = variableBrightnessArr.concat (EstimationCorrector.Model.Estimate (kvals[i]));
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
    Initialization.init();
} catch (err) {
}
