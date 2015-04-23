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
    table : null, // needs to be set to something from the doc
    
    algorithms : ["Argelander", "Paired"],
    
    RebuildComparisonsList : function () {
        
    },
    
    Utils : {
        AddChild : function (parent, tag) {
            var doc = parent.ownerDocument ();
            var res = doc.createElement (tag);
            parent.appendChild (res);
            return res;
        },
        
        AddDeleteLink : function (_row, tddelete) {
            function (r) {
                var deleteAnchor = addChild (tddelete, "a");
                deleteAnchor.innerHTML = "X";
                var tr = r;
                deleteAnchor.onclick = function () {
                    var childTDs = tr.getChildElements ();
                    var i = 0; 
                    for (; i < childTDs.length; i++) {
                        var chidInputs = childTDs [i].getChildElements();
                        var j = 0;
                        for (; j < chidInputs.length; j++)
                            delete chidInputs[j];
                        delete childTDs[i];
                    }
                    delete tr;
                
                    CorrectorUIManager.RebuildComparisonsList();
                }
            }(_row);            
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
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            
            CorrectorUIManager.Utils.AddDeleteLink (row);
            
            var comp = ExtinctionCoefficient.SingleComparison(brightSelector, compImput, dimSelector);
            ExtinctionCoefficient.push (comp);
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
            var dimImput = addChild (tddelete, "input");
            
            var brightSelector = StarsSelection.Selector.build (brightInput);
            var midSelector = StarsSelection.Selector.build (midImput);
            var dimSelector = StarsSelection.Selector.build (dimInput);
            
            CorrectorUIManager.Utils.AddDeleteLink (row);
            
            var comp = ExtinctionCoefficient.PairedComparison(brightSelector, b2m, midImput, m2d, dimSelector);
            ExtinctionCoefficient.push (comp);
        }
    }
};
