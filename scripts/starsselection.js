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
    activeSelectorsMethod : null,
    
    init : function () {
        StarsSelection.imageElem.onclick = function () {
            if (activeSelector && activeSelectorsMethod)
                activeSelector [activeSelectorsMethod] (StarsSelection.currentlyHoveredStar);
        }
    },
    
    Selector : {
        build : function (guiID) {
            function () {
                
                var privateData {
                    "star" : null,
                    "uiElement" : document.getElementById (guiID)
                }
                
                return new function () {
                    var data = privateData;
                    
                    this.set = function (st) {
                        data.star = st;
                        data.uiElement.value = data.star.label;
                    }
                    
                    this.get = function () {
                        return data.star;
                    }
                }
                    
            }();
        }
    }
};

