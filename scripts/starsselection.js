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

var StarsSelection = {
    currentlyHoveredStar : null,
    imageElem : document.getElementById ("svgContainer"),
    activeSelector : null,
	selectionJustActivated: false,
   
    init : function () {
		// set up whatever events we want to be notified
		SVGChart.starLabelClick.add (this.setSelectedStar);
    },
	
	afterStarSelection : {
		handlers : [],
		add : function (handler) {
			this.handlers.push(handler);
		},
		notify : function (selector, star) {
			for (var i = 0; i < this.handlers.length; i++) {
				this.handlers[i] (selector, star);
			}
		}
	},
    
	changedSelector : function (sel) {
		StarsSelection.selectionJustActivated = true;
        if (StarsSelection.activeSelector) {
			StarsSelection.activeSelector.showAsActive (false);
        }
        StarsSelection.activeSelector = sel;
        StarsSelection.imageElem.className = "chartSelectionActive";
	},
	
	setSelectedStar : function (currentlyHoveredStar) {
        if (StarsSelection.activeSelector) {
            // hide the div showing the hovered star
            StarsSelection.activeSelector.set(currentlyHoveredStar);
			StarsSelection.afterStarSelection.notify (StarsSelection.activeSelector, currentlyHoveredStar);
            StarsSelection.activeSelector.showAsActive (false);
            StarsSelection.activeSelector = null;
            StarsSelection.imageElem.className = "chartSelectionInactive";
		}
	},
		
    Selector : {
        build : function (inputElement) {
            return function () {

                var privateData = {
                    "star" : null, // model
                    "uiElement" : inputElement // view + control
                };
                
                return new function () {
					var _this = this;
                    var data = privateData;
					
					var selectorActivated = {
						handlers : [],
						add : function (handler) {
							selectorActivated.handlers.push (handler);
						},
						notify : function () {
							var i = 0;
							for (i = 0; i < selectorActivated.handlers.length; i++)
								selectorActivated.handlers[i] (_this);
						}
					}
					
					// notify the selection manager that we're now active
					selectorActivated.add (StarsSelection.changedSelector);
					// change our look to show that we're active
					selectorActivated.add (function () {_this.showAsActive (true);});
					
                    this.id = data.uiElement.id;
                    this.set = function (st) {
                        if (!st)
                            return;
						EstimationCorrector.updateAirmassFromInput (st);
                        data.star = st;
                        this.update();
                    }   
					
                    this.get = function () {
                        return data.star;
                    }

                    this.setDisplayedString = function (s) {
                        data.uiElement.value = s;
                    }
                    
                    this.update = function () {
						if (data.star){
						        var airmass = "unknown";
						        try {
						            airmass = Computations.Round(data.star.airmass, 3);
						        } catch (err) {
						        }
							this.setDisplayedString (data.star.label + "  ( X = " + airmass + " )");
						}
                    }
					
					this.showAsActive = function (isActive) {
						if (isActive) {
							data.uiElement.className = "selectorItemActive";
							this.setDisplayedString("");
							data.uiElement.placeholder = "click a star label";
						} else {
		                    data.uiElement.className = "selectorItem";
							data.uiElement.placeholder = "click me";
							this.update();
						}
					}
					
					this.show = function (isShown) {
						if (isShown)
							data.uiElement.style.display = "block";
						else
							data.uiElement.style.display = "none";
					}
                    
                    data.uiElement.readOnly = true;	
					this.show (true);
					this.showAsActive (false);
                    data.uiElement["onclick"] = function () { selectorActivated.notify();} // trigger the notifications on click evt
                }
            }();
        }
    }
};

try {
    Initialization.init();
} catch (err) {
}
