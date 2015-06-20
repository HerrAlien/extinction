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

var StarsSelection = {
    currentlyHoveredStar : null,
    imageElem : document.getElementById ("chart"),
    activeSelector : null,
    onStarSelected : null,
    onSelectionActivated : null,
	
   
    init : function () {
    },
    
	setSelectedStar : function (currentlyHoveredStar) {
            if (StarsSelection.activeSelector) {
                // hide the div showing the hovered star
                EstimationCorrector.updateAirmassFromInput (currentlyHoveredStar);
                StarsSelection.activeSelector.set(currentlyHoveredStar);
                StarsSelection.activeSelector.setClassName("selectorItem");
                StarsSelection.activeSelector = null;

                // now redo displayed values
                CorrectorUIManager.onUserInput();
                                
                if (StarsSelection.onStarSelected)
                    StarsSelection.onStarSelected(currentlyHoveredStar);
			}
	},
	
	setSurrentlyHoveredStar : function (star) {
		if (star) {
			StarsSelection.currentlyHoveredStar = star;
		}
	},
	
    Selector : {
        build : function (inputElement) {
            return function () {
                var privateData = {
                    "star" : null,
                    "uiElement" : inputElement
                };
                
                return new function () {
                    var data = privateData;
                    this.id = data.uiElement.id;
                    this.set = function (st) {
                        if (!st)
                            return;
                        data.star = st;
                        this.setDisplayedString (data.star.label + "  ( X = " + Computations.Round(data.star.airmass, 3) + " )");
                    }   
                    this.get = function () {
                        return data.star;
                    }
                    this.addEventHandler = function (eventName, handler) {
                        data.uiElement[eventName] = handler;
                    }
                    this.setClassName = function (cn) {
                        data.uiElement.className = cn;
                    }
                    this.setPlaceholder = function (p) {
                        data.uiElement.placeholder = p;
                    }
                    this.setDisplayedString = function (s) {
                        data.uiElement.value = s;
                    }
                    
                    this.update = function () {
                        this.set(data.star);
                    }
                    
                    this.setClassName("selectorItem");
                    this.setPlaceholder ("click me");
                    data.uiElement.readOnly = true;
                    
                    var sel = this;
                    this.addEventHandler ("onclick", function () {
                        if (StarsSelection.activeSelector) {
                            StarsSelection.activeSelector.setClassName("selectorItem");
                            StarsSelection.activeSelector.setPlaceholder ("click me");
							StarsSelection.activeSelector.update();
                        }
                            
                        sel.setClassName("selectorItemActive");
                        sel.setDisplayedString("");
                        sel.setPlaceholder ("click a star label");
                        
                        StarsSelection.activeSelector = sel;
						
						
                        if (StarsSelection.onSelectionActivated)
                            StarsSelection.onSelectionActivated (sel);
                    });
                }
            }();
        }
    }
};

