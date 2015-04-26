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

var EstimationCorrector = {
    
    pairedComparison : null,
    
    Estimate : function (k){
        var pairedComparison = EstimationCorrector.pairedComparison;
        var bright = pairedComparison.first.bright();
        var b2v = pairedComparison.first.value();
        var variable = pairedComparison.first.dim(); // or second.bright () ...
        var v2d = pairedComparison.second.value();
        var dim = pairedComparison.second.dim(); 
        
        // provide corrections for the difference airmass
        var brightMag = bright.mag + k * (bright.airmass - variable.airmass);
        var dimMag = dim.mag + k * (dim.airmass - variable.airmass);
        
        if (b2v == 0 && v2d == 0)
            return brightMag;
        
        return brightMag + b2v * (dimMag - brightMag) / (b2v + v2d);
    },
    
    init : function () {
        var selectorFieldA = document.getElementById ("selectAforEstimate");
        var selectorA = StarsSelection.Selector.build (selectorFieldA);

        var selectorFieldB = document.getElementById ("selectBforEstimate");
        var selectorB = StarsSelection.Selector.build (selectorFieldB);

        // create the hidden selector for the variable
        var selectorFieldV = CorrectorUIManager.Utils.AddChild (document.documentElement, "input");
        var selectorV = StarsSelection.Selector.build (selectorFieldV);
        selectorV.set (PhotmetryTable.variableStar); // we get the other two from user input
        
        // we don't display it
        selectorFieldV.className = "hidden";
        
        var a2v = document.getElementById ("AtoVar");
        var v2b = document.getElementById ("VarToB");
        
        EstimationCorrector.pairedComparison = ExtinctionCoefficient.PairedComparison (selectorA, a2v, selectorV, v2b, selectorB);
    },
    
    updateAirmassFromInput : function (star) {
        var latitude = eval (document.getElementById ("lat").value);
        var longitude = eval (document.getElementById ("long").value);
        var timeString = document.getElementById ("dateTime").value;
            
        var lst = Computations.LSTFromTimeString (timeString, longitude);
        ExtinctionCoefficient.updateAirmassForStar (star, latitude, longitude, lst);        
    }
};

var CorrectorUIManager = {
    table : document.getElementById("extinctionEstimates"),
    tableHeader : document.getElementById("extinctionEstimatesHeader"), 
    
    useValueForK : document.getElementById ("useValueForK"),
    computeK : document.getElementById ("computeK"),
    useArgelander : document.getElementById ("useArgelander"),
    usePaired : document.getElementById ("usePaired"),
    
    selectedAlgorithm : 0,
    
    init : function () {
        CorrectorUIManager.useValueForK.onclick = function () {
            CorrectorUIManager.computeK.checked = false;
            CorrectorUIManager.onUserInput();
        }
        CorrectorUIManager.computeK.onclick = function () {
            CorrectorUIManager.useValueForK.checked = false;
            CorrectorUIManager.onUserInput();
        }
        
        CorrectorUIManager.useArgelander.onclick = function () {
            CorrectorUIManager.usePaired.checked = false;
            CorrectorUIManager.selectedAlgorithm = 0;
            ExtinctionCoefficient.currentAlgorithmID = 0;
            CorrectorUIManager.ResetHeader();
            CorrectorUIManager.ClearComparisonsList();
            CorrectorUIManager.onUserInput();
        }
        CorrectorUIManager.usePaired.onclick = function () {
            CorrectorUIManager.useArgelander.checked = false;
            CorrectorUIManager.selectedAlgorithm = 1;
            ExtinctionCoefficient.currentAlgorithmID = 1;
            CorrectorUIManager.ResetHeader();
            CorrectorUIManager.ClearComparisonsList();
            CorrectorUIManager.onUserInput();
        }
        
        CorrectorUIManager.useArgelander.onclick();
        CorrectorUIManager.useArgelander.checked = true;
    },
    
    ResetHeader : function () {
        var addChild = CorrectorUIManager.Utils.AddChild;
        CorrectorUIManager.Utils.ClearElement (CorrectorUIManager.tableHeader);
        if (0 == CorrectorUIManager.selectedAlgorithm) {
            var tdbright =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdval =  addChild (CorrectorUIManager.tableHeader, "td");
            var tddim =  addChild (CorrectorUIManager.tableHeader, "td");

            tdbright.innerHTML = "Bright star"; 
            tddim.innerHTML = "Dim star"; 
            tdval.innerHTML = "degrees"; 
        } else {
            var tdbright =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdval_bm =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdmid =  addChild (CorrectorUIManager.tableHeader, "td");
            var tdval_md =  addChild (CorrectorUIManager.tableHeader, "td");
            var tddim =  addChild (CorrectorUIManager.tableHeader, "td");

            tdbright.innerHTML = "Bright star"; 
            tdval_bm.innerHTML = "degrees"; 
            tddim.innerHTML = "Dim star"; 
            tdval_md.innerHTML = "degrees"; 
            tdmid.innerHTML = "Middle star"; 
        }

        var tdadd =  addChild (CorrectorUIManager.tableHeader, "td");
        var anch = addChild(tdadd, "a");
        anch.innerHTML = "(+) Add row";
        anch.noref="";
        anch.className = "addAnchor";
        anch.onclick = function () {
            CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow();
        }
    },
    
    algorithms : ["Argelander", "Paired"],
    
    ClearComparisonsList : function () {
        ExtinctionCoefficient.comparisons = [];
        CorrectorUIManager.Utils.ClearElement (CorrectorUIManager.table);
    },
    
    Utils : {
        AddChild : function (parentElem, tag) {
            var doc = parentElem.ownerDocument;
            var res = doc.createElement (tag);
            parentElem.appendChild (res);
            return res;
        },
        
        AddDeleteLink : function (_row, _tddelete, _comp) {
            var addChild = CorrectorUIManager.Utils.AddChild;
            (function (r, t, c) {
                var tddelete = t;
                var deleteAnchor = addChild (tddelete, "a");
                var comp = c;
                deleteAnchor.innerHTML = "(x) Delete row";
                deleteAnchor.className = "deleteAnchor";
                var tr = r;
                deleteAnchor.onclick = function () {
                    var i = 0; 
                    for (; i < tr.children.length; i++) {
                        var chidInputs = tr.children [i].children;
                        var j = 0;
                        for (; j < chidInputs.length; j++)
                            delete chidInputs[j];
                        delete tr.children[i];
                    }
                    CorrectorUIManager.table.removeChild (tr);
                    delete tr;
                
                    var isAt = ExtinctionCoefficient.comparisons.indexOf (comp);
                    ExtinctionCoefficient.comparisons.splice (isAt, 1);
                    CorrectorUIManager.onUserInput();
                }
            })(_row, _tddelete, _comp);            
        },
        
        ClearElement : function (elem) {
            var i = 0; 
            for (i = 0; i < elem.childNodes.length; i++){
                elem.removeChild(elem.childNodes[i]);
                delete elem.childNodes[i];
            }
            elem.innerHTML = "";
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
            
            compImput.size=2;
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            compImput.oninput = CorrectorUIManager.onUserInput;
            
            var comp = ExtinctionCoefficient.SingleComparison(brightSelector, compImput, dimSelector);
            CorrectorUIManager.Utils.AddDeleteLink (row, tddelete, comp);
            ExtinctionCoefficient.comparisons.push (comp);
        }
    },
    
    Paired : {
        CreateComparisonUIRow : function () {
            var table = CorrectorUIManager.table;
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
            
            b2m.size = 2;
            m2d.size = 2;
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var midSelector = StarsSelection.Selector.build (midImput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            
            b2m.oninput = CorrectorUIManager.onUserInput;
            m2d.oninput = CorrectorUIManager.onUserInput;
            
            var comp = ExtinctionCoefficient.PairedComparison(brightSelector, b2m, midSelector, m2d, dimSelector);
            CorrectorUIManager.Utils.AddDeleteLink (row, tddelete, comp);
            ExtinctionCoefficient.comparisons.push (comp);
        }
    },
    
    onLocationOrTimeChanged : function () {
        // update all airmasses
        var latitude = eval (document.getElementById ("lat").value);
        var longitude = eval (document.getElementById ("long").value);
        var timeString = document.getElementById ("dateTime").value;
        var lst = Computations.LSTFromTimeString (timeString, longitude);
        
        // update the variable comparison aimass,
        ExtinctionCoefficient.updateAirmassForComparison(EstimationCorrector.pairedComparison, latitude, longitude, lst);
        // display the airmasses
        
        ExtinctionCoefficient.updateAirmass (latitude, longitude, timeString);
        // then call the user input callbavck
        CorrectorUIManager.onUserInput();
    },
    
    onUserInput : function () {
        // this is the main callback ...
        // compute estimate with K = 0
        var K = 0;
        var variableBrightness = 0;
        try {
            variableBrightness = EstimationCorrector.Estimate (K);
            document.getElementById("brightnessNoExtinction").innerHTML = Computations.Round (variableBrightness, 2);
        } catch (err) {
        }
        
        // update airmass of V - it never gets selected by the user
        EstimationCorrector.updateAirmassFromInput (PhotmetryTable.variableStar);
        
        // display airmasses
        var airmassA = "unknown";
        var airmassB = "unknown";
        var airmassV = "unknown";
        try {
            airmassA =  EstimationCorrector.pairedComparison.first.bright().airmass;
        } catch (err) {
            airmassA = "unknown";
        }

        try {
            airmassB = EstimationCorrector.pairedComparison.second.dim().airmass;
        } catch (err) {
            airmassB = "unknown";
        }

        try {
            airmassV = EstimationCorrector.pairedComparison.first.dim().airmass;
        } catch (err) {
            airmassV = "unknown";
        }
        
        document.getElementById ("airmassA").innerHTML = Computations.Round (airmassA, 3);
        document.getElementById ("airmassB").innerHTML = Computations.Round (airmassB, 3);
        document.getElementById ("airmassV").innerHTML = Computations.Round (airmassV, 3);
        
        var extinctionCorrectionRequired = Math.abs (airmassA - airmassB) > 0.2 ||
                                           Math.abs (airmassA - airmassV) > 0.2 ||
                                           Math.abs (airmassV - airmassB) > 0.2;
        if (extinctionCorrectionRequired)
            document.getElementById ("shouldComputeExtinction").className = "hidden";
        else
            document.getElementById ("shouldComputeExtinction").className = "";
        
        // get K:
        //  - this can be a constant
        if (document.getElementById ("useValueForK").checked) {
            document.getElementById ("K").readOnly = false;
            K = parseFloat (document.getElementById ("K").value);
        } else {
        //  - or it must be determined from observations
            document.getElementById ("K").readOnly = true;
            K = ExtinctionCoefficient.getAverageValue();
            document.getElementById ("K").value = Computations.Round (K, 2);
        }
        
        try {
            variableBrightness = EstimationCorrector.Estimate (K);
        } catch (err) {
        }
        document.getElementById("brightnessWithExtinction").innerHTML = Computations.Round (variableBrightness, 2);
    }
};
