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

/*
    Mostly model side.
    Should expose a few events:
    - when the table is cleared out
    - when the table finished getting the data
    - when it errors out in attempting to get more data.
*/

var PhotmetryTable = {
    
    variableStar : false,
    
    frame: {
      "fov" : 400,
      "maglimit" : 9,
      "chartID" : "unknown"
    },
	
	comparisonStars : [],	
	onTableRetrieved : false,
	
	setUpdateX : function (star) {
		if (!star["updateAirmass"]) {
			star["updateAirmass"] = function (_lat, _long, lst) { 
				var alt = Computations.Alt (this.ra, this.dec, lst, _lat, _long);
				// then airmass
				if (!isNaN (alt))
					this.airmass = Computations.Airmass (alt);
			}
		}
	},
	
	buildStar : function () {
		var star = {};
		star["ra"]      = 0;
		star["dec"]     = 0;
		star["mag"]     = "unknown", 
        star["label"]   = "V",
        star["airmass"] = 1,
        star["name"]    = "unknown",
		this.setUpdateX (star);
		return star;
	},
	
	init : function () {
		this.onTableRetrieved = Notifications.NewNoParameter();
	},
	
	initFromJSON : function (photometryData) {
		this.frame = photometryData.frame;
        this.variableStar = photometryData.variableStar;
        this.comparisonStars = photometryData.comparisonStars;
		for (i = 0; i < this.comparisonStars.length; i++) {
			var star = this.comparisonStars[i];
			this.setUpdateX (star);
		}
		this.setUpdateX (this.variableStar);
	},
	
    // namespace holding utilities to access the VSP data
    AAVSO : {
        configFromStarName : { // 
            url : "https://www.aavso.org/apps/vsp/api/chart/?format=json",
            method: "GET",
            params : ["star" /* name of the variable star */,
                      "fov"  /* field of view for the field, arcmins */,
                      "maglimit" /* added recently*/]
        },
        
        configFromChartID : {
            url_prefix : "https://www.aavso.org/apps/vsp/api/chart/",
            method: "GET",
            url_suffix : "/?format=json&proxyfor=aavso-vsp-chart-id"
        },        
        
        GetData : function (starsData) {
            PhotmetryTable.comparisonStars = [];
            var i = 0;
            for (i = 0; i < starsData.photometry.length; i++) {
                
                var starJSON = starsData.photometry[i];
                var mag = 0;
                var bandIndex = 0;
                
                for (; bandIndex < starJSON.bands.length; bandIndex++){
                    if (starJSON.bands[bandIndex].band == "V") {
                        mag = starJSON.bands[bandIndex].mag;
                        break;
                    }
                }
                
				var star = PhotmetryTable.buildStar();
				star.ra = Computations.parseCoordinate(starJSON.ra, ":") * 15;
				star.dec = Computations.parseCoordinate(starJSON.dec, ":");
				star.mag = mag;
                star.label =starJSON.label;
                PhotmetryTable.comparisonStars.push ( star);
            }
            
			PhotmetryTable.variableStar = PhotmetryTable.buildStar();
            PhotmetryTable.variableStar.ra = Computations.parseCoordinate(starsData.ra, ":") * 15;
            PhotmetryTable.variableStar.dec = Computations.parseCoordinate(starsData.dec, ":");                
            PhotmetryTable.variableStar.name = starsData.star;                
            PhotmetryTable.frame.fov = starsData.fov;
            PhotmetryTable.frame.maglimit = starsData.maglimit;
            PhotmetryTable.frame.chartID = starsData.chartid;
        },
        
        IsChartID : function (text) {
            // chart IDs do not have anything else than alphanumeric characters
            var i = 0;
            var isAlphanumeric = true;
            for (i = 0; i < text.length && isAlphanumeric; i++)
            {
                var code = text.charCodeAt(i);
                isAlphanumeric = isAlphanumeric && 
                                 ((code >= 48 && code <= 57) ||
                                  (code >= 65 && code <= 90) ||
                                  (code >= 97 && code <= 122))
            }
            return isAlphanumeric;
        },
    
		initFromStarName : function (starName, fov, limitingMag) {
			var cfg = PhotmetryTable.AAVSO.configFromStarName;
			fetch (cfg.url + "&" + cfg.params[0] + "=" + starName + 
							"&" + cfg.params[1] + "=" + fov +
							"&" + cfg.params[2] + "=" + limitingMag +
							"&proxyfor=aavso-vsp")
			      .then(response => { return response.text()})
			      .then(text => { PhotmetryTable.AAVSO.onDataRetrieved(text); });
		},
		
		initFromChartID : function (chartID) {
			var cfg = PhotmetryTable.AAVSO.configFromChartID;
			fetch(cfg.url_prefix + chartID + cfg.url_suffix)
			      .then(response => { return response.text()})
			      .then(text => { PhotmetryTable.AAVSO.onDataRetrieved(text); });
		},
		
		onDataRetrieved : function (doc) {
			if (doc == ""){
				// bad connection?
				// TODO: this should be a notification 
				Log.message ("Could not retrieve the photometry table; check your internet connection.");
				return;
			}
				 
			// this is now JSON!
			var starsData = JSON.parse (doc);
			var hasPhotometry = (starsData.photometry != null) && (starsData.photometry.length > 0);
		
			if (!hasPhotometry){
				// check for errors reported by aavso
				var errorsStr = "Could not retrieve the photometry data:";
				var errors = starsData["errors"];
				if (errors != null) {
					var i = 0;
					for (i = 0; i < errors.length; i++)
						errorsStr = errorsStr + "\n" + errors[i];
				}

				var detail = starsData["detail"];
				if (detail != null)
					errorsStr = errorsStr + "\n" + detail
				
				// TODO: this should be a notification 
				Log.message (errorsStr);
				return;
			}            

			this.GetData (starsData);
			PhotmetryTable.onTableRetrieved.notify();
		}
	}
};

try {
    Initialization.init();
} catch (err) {
}
