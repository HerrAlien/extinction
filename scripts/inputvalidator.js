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
	
	validate : function (inp) {
		var i = 0;
		for (i = 0; i < InputValidator.inputsWithValidators.length; i++){
			var currentEntry = InputValidator.inputsWithValidators[i];
			if (currentEntry.input == inp && currentEntry.func)
				currentEntry.func();
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
		(function (){
			var _m = min;
			var _M = max;
			var _i = input;
			InputValidator.inputsWithValidators.push ({"input" : _i, 
				"func" : function () {
					var value = _i.value * 1.0;
					var lbl = InputValidator.getErrorLabel();
					if (value > _M || value < _m) {
						lbl.innerHTML = "Invalid numerical value: " + value + "." +
										"<br>&nbsp;&nbsp;allowed minimum = " + _m + 
										"<br>&nbsp;&nbsp;allowed maximum = " + _M;
						lbl.style["display"] = "block";
						lbl.style["top"] = _i.offsetTop - _i.scrollTop + _i.clientHeight + 5;
						lbl.style["left"] = _i.offsetLeft  - _i.scrollLeft;
					} else
						lbl.style["display"] = "none";					
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
				var lbl = InputValidator.getErrorLabel();
				if (value < _m) {
					lbl.innerHTML = "Invalid numerical value: " + value + "." +
									"<br>&nbsp;&nbsp;allowed minimum = " + _m;
					lbl.style["display"] = "block";
					lbl.style["top"] = _i.offsetTop - _i.scrollTop + _i.clientHeight + 5;
					lbl.style["left"] = _i.offsetLeft  - _i.scrollLeft;
				} else
					lbl.style["display"] = "none";					
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
				var lbl = InputValidator.getErrorLabel();
				if (value > _M) {
					lbl.innerHTML = "Invalid numerical value: " + value + "." +
					                "<br>&nbsp;&nbsp;allowed maximum = " + _M;
					lbl.style["display"] = "block";
					lbl.style["top"] = _i.offsetTop - _i.scrollTop + _i.clientHeight + 5;
					lbl.style["left"] = _i.offsetLeft  - _i.scrollLeft;
				} else
					lbl.style["display"] = "none";					
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
				var value = _i.value;
				var lbl = InputValidator.getErrorLabel();
				if (value == "") {
					lbl.innerHTML = _m;
					lbl.style["display"] = "block";
					lbl.style["top"] = _i.offsetTop - _i.scrollTop + _i.clientHeight + 5;
					lbl.style["left"] = _i.offsetLeft  - _i.scrollLeft;
				} else
					lbl.style["display"] = "none";					
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
				var lbl = InputValidator.getErrorLabel();
				if (errorMsg != "") {
					lbl.innerHTML = errorMsg;
					lbl.style["display"] = "block";
					lbl.style["top"] = _i.offsetTop - _i.scrollTop + _i.clientHeight + 5;
					lbl.style["left"] = _i.offsetLeft  - _i.scrollLeft;
				} else
					lbl.style["display"] = "none";					
			}
			});
		})();
	}
};
