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

    searchTree : {        
        root : null,
        
        settings : {
            maxStarsPerNode : 8
        },
        
        getClosestStar : function(raNum, decNum) {
            var foundStar = null;
            // this gets filled with the result of the search
            
            var closestStars = PhotmetryTable.searchTree.root.GetStarsAt ([raNum, decNum]);
            
            // loop through them, return the one closest to input param
            var i = 0;
            var distanceSqrMin = 999999999;
            var currentSqrDistance = 0;
            var diffRA = 0;
            var diffDec = 0;
            for (i = 0; i < closestStars.length; i++) {
                diffRA = raNum - closestStars[i]["ra"];
                diffDec = decNum - closestStars[i]["dec"];
                
                currentSqrDistance = diffRA * diffRA + diffDec * diffDec;
                if (currentSqrDistance < distanceSqrMin) {
                    distanceSqrMin = currentSqrDistance;
                    foundStar = closestStars[i];
                }
            }
            
            return foundStar;
        },
        
        node : function (coords, fov, stars, __mag) {
        
                var _coords = coords;
                var _fov = fov;
                var _stars = stars;
                var mag = __mag;
              
                return new function() {
                    this.sons = [];
                    this.coords = _coords;
                    this.fov = _fov;
                    this.stars = [];
                    this.mag = mag;
                
                    this.HasCoords = function (radec) {
                        var hc_halfFOVDeg = 0.5 / 60 * this.fov; 
                        return ((radec[0] > (this.coords[0] - hc_halfFOVDeg)) && (radec [0] < (this.coords[0] + hc_halfFOVDeg)) &&
                                (radec[1] > (this.coords[1] - hc_halfFOVDeg)) && (radec [1] < (this.coords[1] + hc_halfFOVDeg)));
                    }
                    
                    this.GetStarsAt = function (radec) {
                        if (this.HasCoords(radec)){
                            if (this.stars.length != 0)
                                return this.stars;
                            else {
                                var i = 0; 
                                for (i = 0; i < this.sons.length; i++) {
                                    var sonsStars = this.sons [i].GetStarsAt (radec);
                                    if (sonsStars.length > 0)
                                      return sonsStars;
                                }
                            }
                        }
                        return [];
                    }
                    
                    this.FilterStars = function (pStars, _m) {
                        // do an initial fill here; this acts as filter for sons
                        var starIndex = 0;
                        var __starsForThisNode = [];
                        for (;starIndex < pStars.length; starIndex++) {
                            if (_m > pStars[starIndex]["mag"]) {
                                if (this.HasCoords ( [pStars[starIndex]["ra"], pStars[starIndex]["dec"]] ) )
                                    __starsForThisNode.push (pStars[starIndex]);
                            } 
                        }
                        
                        return __starsForThisNode;
                    }
                    
                    this.SerializeToStr  = function () {
                        var res = this.stars.length + " stars at (" + this.coords[0] + ", " + this.coords[1] + "), fov = " + this.fov + "\n" 
                                    + this.sons.length + " sons: \n";
                        var sonIndex = 0;
                        for (sonIndex = 0; sonIndex < this.sons.length; sonIndex++)
                            res = res + this.sons[sonIndex].SerializeToStr();
                    
                        return res;
                    }
                    
                    this.SetupNode = function (parentStars) {
                        var myself = this;
                        (function () {
                            var myOldFOV = myself.fov;
                            myself.fov = myself.fov * 1.5; // enlarge the FOV, so that we overlap a bit
                            var _stars = myself.FilterStars (parentStars, mag);
                            myself.fov = myOldFOV;
                            
                            var sonsCenterDispDEG = myself.fov / 240.0;
                            var _fov = myself.fov * 0.5;

                            if (_stars.length > PhotmetryTable.searchTree.settings.maxStarsPerNode) {
                                myself.sons [0] = function(){                         
                                    var _coords = [myself.coords[0] + sonsCenterDispDEG, myself.coords[1] + sonsCenterDispDEG];
                                    return PhotmetryTable.searchTree.node(_coords, _fov, _stars, mag);
                                }();
                                myself.sons [1] = function(){                         
                                    var _coords = [myself.coords[0] - sonsCenterDispDEG, myself.coords[1] + sonsCenterDispDEG];
                                    return PhotmetryTable.searchTree.node(_coords, _fov, _stars, mag);
                                }();
                                myself.sons [2] = function(){                         
                                    var _coords = [myself.coords[0] - sonsCenterDispDEG, myself.coords[1] - sonsCenterDispDEG];
                                    return PhotmetryTable.searchTree.node(_coords, _fov, _stars, mag);
                                }();
                                myself.sons [3] = function(){                         
                                    var _coords = [myself.coords[0] + sonsCenterDispDEG, myself.coords[1] - sonsCenterDispDEG];
                                    return PhotmetryTable.searchTree.node(_coords, _fov, _stars, mag);
                                }();
                                myself.stars = [];
                            }
                            else
                                myself.stars = _stars;
                        })();
                    }
                    
                    this.SetupNode(_stars);
                }
        },
        
        init : function (data, mag) {
            // create the quad tree            
            PhotmetryTable.searchTree.root = PhotmetryTable.searchTree.node (data.centerCoords, data.fov, data.stars, mag);
        }
    },
    
    // namespace holding utilities to access the VSP data
    AAVSO : {
        config: { // 
            url : "https://www.aavso.org/cgi-bin/vsp.pl?ccdtable=on&chartid=",
            method: "GET"
        },
        
        configFromStarName : { // 
            url : "https://www.aavso.org/cgi-bin/vsp.pl?ccdtable=on",
            method: "GET",
            params : ["name" /* name of the variable star */,
                      "fov"  /* field of view for the field, arcmins */]
        },
        
        GetData : function (text) {
            var data = {
                centerCoords : [0, 0],
                fov : 400,
                stars : []
            };
            data.fov = PhotmetryTable.AAVSO.GetFOV (text);
            data.centerCoords = PhotmetryTable.AAVSO.GetCoords(text);
            data.stars = PhotmetryTable.AAVSO.GetStars (text);
            
            return data;
        },
        
        GetFOV : function (text) {
            var fovBegins = text.indexOf ("within ") + 7; // length of string
            return 2 * 60 * Computations.evalNum (text.substr (fovBegins, 7));
        },
        
        GetCoords : function (text) {

            truncatedText = text.toLowerCase()
            
            var numberStartsAt = truncatedText.indexOf (" (") + 2;
            var numberEndsAt = truncatedText.indexOf (")</font>");
            var raStr = truncatedText.substring (numberStartsAt, numberEndsAt);
            var ra = Computations.evalNum (raStr);
            
            var decText = truncatedText.substring (numberEndsAt + 1);
            numberStartsAt = decText.indexOf (" (") + 2;
            numberEndsAt = decText.indexOf (")</font>");
            var decStr = decText.substring (numberStartsAt, numberEndsAt);
            var dec = Computations.evalNum (decStr);
            
            return [ra, dec];
        },
        
        extractNumericalValue : function  (str, begin, end) {
                var valueStartsAt = str.indexOf (begin) + begin.length;
                var valueEndsAt =  str.indexOf (end);
                var valueAsString = str.substring (valueStartsAt, valueEndsAt);
                return Computations.evalNum (valueAsString);
                
        },
        
        GetStars : function (text) {
            var stars = [];
            // parse the DOM
            // but first, insert it in the doc
            
            var parser = new DOMParser();
            var docAsDOM = parser.parseFromString(text, "text/html");
            
            var hostElement = docAsDOM.documentElement;
            // get the table
            var table = hostElement.getElementsByTagName("table")[0];
            
            
                var i = 1;
                for (i = 1; i < table.rows.length - 2; i++) {
                    var currentRow = table.rows[i];
                    
                    var raNum = PhotmetryTable.AAVSO.extractNumericalValue (currentRow.cells[1].innerHTML, "[", "d]");
                    var decNum = PhotmetryTable.AAVSO.extractNumericalValue (currentRow.cells[2].innerHTML, "[", "d]");
                    var labelStr = "n/a";
                    try{   
                        labelStr= PhotmetryTable.AAVSO.extractNumericalValue (currentRow.cells[3].innerHTML, "<B>", "</B>");
                    } catch (err1) {
                        labelStr = PhotmetryTable.AAVSO.extractNumericalValue (currentRow.cells[3].innerHTML, "<b>", "</b>");
                    }
                    var magNum = 0.1 * Computations.evalNum (labelStr);
                    try {
                        magNum = PhotmetryTable.AAVSO.extractNumericalValue (currentRow.cells[6].innerHTML, "<FONT size=-1>", " (");
                    } catch (err2) {
                        try {
                            magNum = PhotmetryTable.AAVSO.extractNumericalValue (currentRow.cells[6].innerHTML, "<font size=\"-1\">", " (");
                        } catch (err3) {
                        }
                    }
                        
                    if (magNum > -3) {
                        var star = { "ra" : raNum, "dec" : decNum, "mag" : magNum, "label" : labelStr, "airmass" : 1 };
                        stars.push ( star );
                    }
                }
            
            return stars;
        }
        
    },

    onInit : function () {
        
    },
    
    init : function (chartID, limittingMag) {
        var xmlHttpReq = new XMLHttpRequest({mozSystem: true});
        xmlHttpReq.onreadystatechange = function() {
			PhotmetryTable.onDataRetrieved (this, limittingMag);
		}
        xmlHttpReq.open(PhotmetryTable.AAVSO.config.method, PhotmetryTable.AAVSO.config.url + chartID, true);
        xmlHttpReq.send(null);              
    },
    
    initFromStarName : function (starName, fov, limitingMag) {
        var xmlHttpReq = new XMLHttpRequest({mozSystem: true});
        xmlHttpReq.onreadystatechange = function() {
				PhotmetryTable.onDataRetrieved (this, limitingMag);
			}
		var cfg = PhotmetryTable.AAVSO.configFromStarName;
        xmlHttpReq.open(cfg.method, cfg.url + "&" + cfg.params[0] + "=" + starName + 
						"&" + cfg.params[1] + "=" + fov
                        + "&proxyfor=aavso-vsp", true);
        xmlHttpReq.send(null);   
    },
    
	onDataRetrieved : function (xmlHttpReq, limittingMag) {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;
                var structuredData  = PhotmetryTable.AAVSO.GetData (doc);
				PhotmetryTable.comparisonStars = structuredData.stars;
                
                PhotmetryTable.searchTree.init (structuredData, limittingMag);
                
                PhotmetryTable.variableStar.ra = structuredData.centerCoords[0];
                PhotmetryTable.variableStar.dec = structuredData.centerCoords[1];
                
                PhotmetryTable.onInit();
			}
	},
	
    updateAirmass : function (_lat, _long, _time){
        // for each star, compute altitude
        // then airmass
    }
};
