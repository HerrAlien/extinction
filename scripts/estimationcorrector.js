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
    Estimate : function (pairedComparison, k){
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
        }
        CorrectorUIManager.computeK.onclick = function () {
            CorrectorUIManager.useValueForK.checked = false;
        }
        
        CorrectorUIManager.useArgelander.onclick = function () {
            CorrectorUIManager.usePaired.checked = false;
            CorrectorUIManager.selectedAlgorithm = 0;
            CorrectorUIManager.ResetHeader();
        }
        CorrectorUIManager.usePaired.onclick = function () {
            CorrectorUIManager.useArgelander.checked = false;
            CorrectorUIManager.selectedAlgorithm = 1;
            CorrectorUIManager.ResetHeader();
        }
        
        CorrectorUIManager.useArgelander.onclick();
        CorrectorUIManager.useArgelander.checked = true;
    },
    
    ResetHeader : function () {
        var addChild = CorrectorUIManager.Utils.AddChild;
        CorrectorUIManager.tableHeader.innerHTML = "";
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
        anch.onclick = function () {
            CorrectorUIManager[CorrectorUIManager.algorithms[CorrectorUIManager.selectedAlgorithm]].CreateComparisonUIRow();
        }
    },
    
    algorithms : ["Argelander", "Paired"],
    
    RebuildComparisonsList : function () {
        
    },
    
    Utils : {
        AddChild : function (parentElem, tag) {
            var doc = parentElem.ownerDocument;
            var res = doc.createElement (tag);
            parentElem.appendChild (res);
            return res;
        },
        
        AddDeleteLink : function (_row, _tddelete) {
            var addChild = CorrectorUIManager.Utils.AddChild;
            (function (r, t) {
                var tddelete = t;
                var deleteAnchor = addChild (tddelete, "a");
                deleteAnchor.innerHTML = "(x) Delete row";
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
                
                    CorrectorUIManager.RebuildComparisonsList();
                }
            })(_row, _tddelete);            
        }
    },
    
    Argelander : {
        CreateComparisonUIRow : function () {
            var table = CorrectorUIManager.table;
            var addChild = CorrectorUIManager.Utils.AddChild;
            
            var row = addChild (table, "tr");
            var tdbright =  addChild (row, "td");
            var tdval =  addChild (row, "td");
            var tddim =  addChild (row, "td");
            var tddelete =  addChild (row, "td");
            
            var brightInput = addChild (tdbright, "input");
            var compImput = addChild (tdval, "input");
            var dimInput = addChild (tddim, "input");
            
            compImput.size=2;
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            
            CorrectorUIManager.Utils.AddDeleteLink (row, tddelete);
            
            var comp = ExtinctionCoefficient.SingleComparison(brightSelector, compImput, dimSelector);
            ExtinctionCoefficient.comparisons.push (comp);
        }
    },
    
    Paired : {
        CreateComparisonUIRow : function () {
            var table = CorrectorUIManager.table;
            var addChild = CorrectorUIManager.Utils.AddChild;
            
            var row = addChild (table, "tr");
            var tdbright =  addChild (row, "td");
            var tdval_bm =  addChild (row, "td");
            var tdmid =  addChild (row, "td");
            var tdval_md =  addChild (row, "td");
            var tddim =  addChild (row, "td");
            var tddelete =  addChild (row, "td");
            
            var brightInput = addChild (tdbright, "input");
            var b2m = addChild (tdval_bm, "input");
            var midImput = addChild (tdmid, "input");
            var m2d = addChild (tdval_md, "input");
            var dimInput = addChild (tddim, "input");

            b2m.size = 2;
            m2d.size = 2;

            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var midSelector = StarsSelection.Selector.build (midImput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            
            CorrectorUIManager.Utils.AddDeleteLink (row, tddelete);
            
            var comp = ExtinctionCoefficient.PairedComparison(brightSelector, b2m, midImput, m2d, dimSelector);
            ExtinctionCoefficient.comparisons.push (comp);
        }
    }
};
