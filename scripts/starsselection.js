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

var StarsSelection = {
    currentlyHoveredStar : null,
    imageElem : document.getElementById ("chart"),
    activeSelector : null,
    
    init : function () {
        StarsSelection.imageElem.onclick = function () {
            if (StarsSelection.activeSelector)
                StarsSelection.activeSelector.set(StarsSelection.currentlyHoveredStar);
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
                    var sel = this;
                    
                    this.set = function (st) {
                        data.star = st;
                        data.uiElement.value = data.star.label;
                    }   
                    this.get = function () {
                        return data.star;
                    }
                    this.addEventHandler = function (eventName, handler) {
                        data.uiElement[eventName] = handler;
                    }
                    
                    this.addEventHandler ("onclick", function () {
                        StarsSelection.activeSelector = sel;
                    });
                }
            }();
        },
        
        buildIntoDOM : function (parentElement) {
            var createdInput = parentElement.ownerDocument.createElement ("input");
            parentElement.appendChild (createdInput);
            return Selector.build (createdInput);
        }
    }
};

