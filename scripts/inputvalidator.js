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

var InputValidator = {
	
	inputsWithValidators : [],
	
	errorLabel : null,
	
	validate : function (inp, cfg) {
		var i = 0;
		for (i = 0; i < InputValidator.inputsWithValidators.length; i++){
			var currentEntry = InputValidator.inputsWithValidators[i];
			if (currentEntry.input == inp && currentEntry.func) {
				var c = {};
				if (cfg)
					c = cfg;
				c.elemToMoveTo = inp;
				InputValidator.validate_internal (c, currentEntry.func);
			}
		}
	},
	
	validate_internal : function (c, getMsgFunc) {
			var appendMessage = false;
			var hideError = false;
			var elemToMoveTo = null;
			var prependMsg = ""
			var lbl = InputValidator.getErrorLabel();
			lbl.style["display"] = "none";

			if (c) {
				appendMessage = c.appendMessage;
				hideError = c.hideError;
				elemToMoveTo = c.elemToMoveTo;
				if (c.prependMsg)
					prependMsg = c.prependMsg;
			}
			
			var msg = getMsgFunc();
			if (msg != "") {
				msg = prependMsg + msg;
				if (appendMessage)
					lbl.innerHTML = lbl.innerHTML + "<br>" + msg;
				else
					lbl.innerHTML = msg;
				
				if (hideError)
					lbl.style["display"] = "none";
				else
					lbl.style["display"] = "block";
				
				if (elemToMoveTo) {
					var coords = InputValidator.ComputeLabelPos(elemToMoveTo);
					lbl.style["left"] = coords[0] + "px";
					lbl.style["top"] = coords[1] + "px";
				}
			}
	},
	
	getErrorLabel : function () {
		if (InputValidator.errorLabel == null) {
			var lbl = document.createElement ("div");
			InputValidator.errorLabel = lbl;
			document.documentElement.appendChild (lbl);
			// set the style ...
			lbl.style["position"] = "absolute";
			lbl.style["z-index"] = 99;
			lbl.style["margin"] = "5px";
			lbl.style["width"] = "240px";
			lbl.style["max-width"] = "240px";
			lbl.style["background-color"] = "#FFE0E0";
			lbl.style["border"] = "solid 2px #FF0000";
			lbl.style["top"] = 0;
			lbl.style["left"] = 0;
			lbl.style["display"] = "none";
		}
		return InputValidator.errorLabel;
	},
	
	AddNumberRangeValidator : function (input, min, max) {
		(function (c){
			var _m = min;
			var _M = max;
			var _i = input;
			
			InputValidator.inputsWithValidators.push ({"input" : _i, 
				"func" : function () {
					var value = _i.value * 1.0;					
					if (value > _M || value < _m) {
						return "Invalid numerical value: " + value + "." +
								"<br>&nbsp;&nbsp;allowed minimum = " + _m + 
								"<br>&nbsp;&nbsp;allowed maximum = " + _M;					
					}
					return "";					
				}
			});
		})();
	},
	
	AddNumberMinimumValidator : function (input, min) {
		(function (){
			var _m = min;
			var _i = input;
			InputValidator.inputsWithValidators.push ({"input" : _i, 
				"func" : function () {
                    var value = _i.value * 1.0;                  
                    if (value < _m)
                        return "Invalid numerical value: " + value + "." + "<br>&nbsp;&nbsp;allowed minimum = " + _m;
                    return "";					
                }
			});
		})();
	},
	
	AddNumberMaximumValidator : function (input, max) {
		(function (){
			var _M = max;
			var _i = input;
			InputValidator.inputsWithValidators.push ({"input" : _i, 
				"func" : function () {
                    var value = _i.value * 1.0;
                    if (value > _M)
                        return "Invalid numerical value: " + value + "." + "<br>&nbsp;&nbsp;allowed maximum = " + _M;
                    return "";
                }
			});
		})();
	},
	
	AddStringRequiredValidator : function (input, message) {
		(function (){
			var _m = message;
			var _i = input;
			InputValidator.inputsWithValidators.push ({"input" : _i, 
				"func" : function () {
                    if (_i.value == "")
                        return _m;
					return "";
                }
			});
		})();
	},
	
	AddCustomValidatorWithMessage : function (input, messageBuilder) {
		(function (){
			var _f = messageBuilder;
			var _i = input;
			InputValidator.inputsWithValidators.push ({"input" : _i, 
				"func" : function () {
                    var errorMsg = _f();
                    if (errorMsg != "") 
                        return errorMsg; 
					return "";					
                }
			});
		})();
	},
    
    ComputeLabelPos : function (_i) {
        var r = _i.getBoundingClientRect();
		var doc = document.documentElement;
		var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
		var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        return [r.left +left , r.top + top + _i.clientHeight + 5];
    }
};
