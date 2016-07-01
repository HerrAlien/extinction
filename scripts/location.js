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

var Location = {
	// this is the model
	latitude : 0,
	longitude : 0,
	enteredTime : 0,
	// internal computed value
	lst : 0,
	
	// all airmass recompute subscribe to this one
	onLocationUpdated: Notifications.NewNoParameter(),
	
	// these are the controls
	Controls : {
		lat : document.getElementById ("lat"),
		long: document.getElementById ("long"),
		time: document.getElementById ("dateTime"),
        geolocation : document.getElementById("geolocation"),
		
		init : function (){
			this.lat.oninput = function () {
                Location.latitude = Computations.evalNum(Location.Controls.lat.value);
                Location.onLocationUpdated.notify(); // notify airmass recomputes ...
            }
			this.long.oninput = function () {
                Location.longitude = Computations.evalNum(Location.Controls.long.value);
                // recompute LST
                Location.enteredTime = Location.Controls.time.value;
                Location.lst = Computations.LSTFromTimeString (Location.enteredTime, Location.longitude);
                Location.onLocationUpdated.notify(); // notify airmass recomputes ...
            }
			this.time.oninput = function () {
                // recompute LST
                Location.enteredTime = Location.Controls.time.value;
                Location.lst = Computations.LSTFromTimeString (Location.enteredTime, Location.longitude);
                Location.onLocationUpdated.notify(); // notify airmass recomputes ...
            }
            this.geolocation.onclick = function () {
                var geoLocationAPI = navigator.geolocation || window.navigator.geolocation;
                if (geoLocationAPI) {
                    geoLocationAPI.getCurrentPosition (function (position) {
                        Location.Controls.lat.value = position.coords.latitude;
                        Location.Controls.long.value = position.coords.longitude;
                        InputValidator.validate (Location.Controls.lat);
                        InputValidator.validate (Location.Controls.long);
                        Location.latitude = Computations.evalNum(Location.Controls.lat.value);
                        Location.Controls.long.oninput();
                   });
                }
            }

			InputValidator.AddNumberRangeValidator (this.lat, -90, 90);
			InputValidator.AddNumberRangeValidator (this.long, -180, 180);
			
			this.lat.onfocus = function () { InputValidator.validate (this); }
			this.long.onfocus = function () { InputValidator.validate (this); }

			this.lat.onmouseenter = this.onfocus;
			this.long.onmouseenter = this.onfocus;
            
            var currentDate = new Date();
        
            var month = currentDate.getMonth() + 1;
            if (month < 10)
                month = "0" + month;
            
            var day = currentDate.getUTCDate();
            if (day < 10)
                day = "0" + day;
            
            var h = currentDate.getUTCHours();
            if (h < 10)
                h = "0" + h;
            
            var m = currentDate.getUTCMinutes();
            if (m < 10)
                m = "0" + m;

            var s = currentDate.getUTCSeconds();
            if (s < 10)
                s = "0" + s;

            this.time.value = currentDate.getUTCFullYear() + "/" + month + "/" + day + " " + h + ":" + m + ":" + s;
		}
	},
	
	init : function () {
		this.Controls.init();
	}
};

try {
    Initialization.init();
} catch (err) {
}
