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

var PhotmetryTable = {
    
    variableStar : { 
        "ra" : 0, 
        "dec" : 0, 
        "mag" : "unknown", 
        "label" : "V",
        "airmass" : 1
    },
	
	comparisonStars : [],

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
        
        parseCoordinate : function (coord) {
            if (!isNaN(coord))
                return coord;
            
            var comps = coord.split(":");
            var sign = 1.0;
            if (comps[0] * 1.0 < 0)
                sign = -1.0;

            return comps[0]*1.0 + sign*comps[1]/60.0 + sign*comps[2]/3600.0;
        },

        GetData : function (starsData) {
            var stars = [];
            var i = 0;
            for (i = 0; i < starsData.photometry.length; i++) {
                var starJSON = starsData.photometry[i];
                stars.push ( 
                    { 
                        "ra" : PhotmetryTable.AAVSO.parseCoordinate(starJSON.ra) * 15,
                        "dec" : PhotmetryTable.AAVSO.parseCoordinate(starJSON.dec),
                        "mag" : starJSON.bands[0].mag,
                        "label" : starJSON.label
                    }
                );
            }
            
            return {
                "centerCoords" : [PhotmetryTable.AAVSO.parseCoordinate(starsData.ra) * 15, 
                                  PhotmetryTable.AAVSO.parseCoordinate(starsData.dec)], // and it also has the center coordinates
                "fov" : starsData.fov,
                "stars" : stars,
                "maglimit" : starsData.maglimit
            };
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
        }        
    },

    onInit : function () {        
    },
    
    initFromStarName : function (starName, fov, limitingMag) {
        var xmlHttpReq = new XMLHttpRequest({mozSystem: true});
        xmlHttpReq.onreadystatechange = function() {
            if (4 != xmlHttpReq.readyState)
                return;
			PhotmetryTable.onDataRetrieved (this);
		}
   		var cfg = PhotmetryTable.AAVSO.configFromStarName;
        xmlHttpReq.open(cfg.method, cfg.url + "&" + cfg.params[0] + "=" + starName + 
						"&" + cfg.params[1] + "=" + fov +
   						"&" + cfg.params[2] + "=" + limitingMag +
                        "&proxyfor=aavso-vsp", true);
        xmlHttpReq.send(null);
    },
    
    initFromChartID : function (chartID) {
        var xmlHttpReq = new XMLHttpRequest({mozSystem: true});
        xmlHttpReq.onreadystatechange = function() {
            if (4 != xmlHttpReq.readyState)
                return;
    	   PhotmetryTable.onDataRetrieved (this);
    	}
       	
        var cfg = PhotmetryTable.AAVSO.configFromChartID;
        xmlHttpReq.open(cfg.method, cfg.url_prefix + chartID + cfg.url_suffix, true);
        xmlHttpReq.send(null);
    },
    
	onDataRetrieved : function (xmlHttpReq) {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;
                if (doc == ""){
                    // bad connection?
                    Log.message ("Could not retrieve the photometry table; check your internet connection.");
                    return;
                }
                 
                // this is now JSON!
                var starsData = JSON.parse (doc);
                // check for errors reported by aavso
                var errors = starsData["errors"];
                if (errors != null) {
                    var i = 0, errorsStr = "";
                    for (i = 0; i < errors.length - 1; i++)
                        errorsStr = errorsStr + errors[i] + "<br>";
                    errorsStr = errorsStr + errors[i];
                    Log.message (errorsStr);
                    return;
                }                

                var structuredData  = PhotmetryTable.AAVSO.GetData (starsData);
				PhotmetryTable.comparisonStars = structuredData.stars;                
                PhotmetryTable.variableStar.ra = structuredData.centerCoords[0];
                PhotmetryTable.variableStar.dec = structuredData.centerCoords[1];                
                PhotmetryTable.onInit();
			}
	}
};
