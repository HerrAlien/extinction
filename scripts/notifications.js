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

var Notifications = {
	NewNoParameter : function () { 
		var a = {
			_handlers : [],
			add : function (handler) {
				a._handlers.push (handler);
			},
			notify : function () {
				var i = 0;
				for (i = 0; i < a._handlers.length; i++)
					a._handlers[i]();
			}
		};
		return a;
	}
};

try {
    Initialization.init();
} catch (err) {
}
