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
        configFromStarName : { // 
            url : "https://www.aavso.org/apps/vsp/api/chart/?format=json",
            method: "GET",
            params : ["star" /* name of the variable star */,
                      "fov"  /* field of view for the field, arcmins */,
                      "maglimit" /* added recently*/]
        },
               
        raToDecimalRa : function (sexadecimal) {
            // split into hours, minutes, seconds
            var comps = sexadecimal.split(":");
            return 15.0*comps[0] + comps[1]/4.0 + comps[2]/900.0;
        },
        
        decToDecimalDec : function (sexadecimal) {
            // split into hours, minutes, seconds
            var comps = sexadecimal.split(":");
            var sign = 1.0;
            if (comps[0] * 1.0 < 0)
                sign = -1.0;
            return comps[0]*1.0 + sign*comps[1]/60.0 + sign*comps[2]/3600.0;
        },

        GetData : function (text, fov) {
            var stars = [];
            // this is now JSON!
            var starsData = JSON.parse (text);
            var i = 0;
            for (i = 0; i < starsData.photometry.length; i++) {
                var starJSON = starsData.photometry[i];
                stars.push (
                    { 
                        "ra" : PhotmetryTable.AAVSO.raToDecimalRa(starJSON.ra) ,
                        "dec" : PhotmetryTable.AAVSO.decToDecimalDec(starJSON.dec) ,
                        "mag" : starJSON.bands[0].mag,
                        "label" : starJSON.label
                    }
                );
            }
            
            return {
                "centerCoords" : [starsData.ra, starsData.dec], // and it also has the center coordinates
                "fov" : fov,
                "stars" : stars
            };
        }        
    },

    onInit : function () {        
    },
    
    initFromStarName : function (starName, fov, limitingMag) {
        var xmlHttpReq = new XMLHttpRequest({mozSystem: true});
        xmlHttpReq.onreadystatechange = function() {
            if (4 != xmlHttpReq.readyState)
                return;
			PhotmetryTable.onDataRetrieved (this, limitingMag, fov);
		}
   		var cfg = PhotmetryTable.AAVSO.configFromStarName;
        xmlHttpReq.open(cfg.method, cfg.url + "&" + cfg.params[0] + "=" + starName + 
						"&" + cfg.params[1] + "=" + fov +
   						"&" + cfg.params[2] + "=" + limitingMag +
                        "&proxyfor=aavso-vsp", true);
        xmlHttpReq.send(null);
    },
    
	onDataRetrieved : function (xmlHttpReq, limittingMag, fov) {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;
                var structuredData  = PhotmetryTable.AAVSO.GetData (doc, fov * 1.0);
				PhotmetryTable.comparisonStars = structuredData.stars;
                
                PhotmetryTable.searchTree.init (structuredData, limittingMag * 1.0);
                
                PhotmetryTable.variableStar.ra = structuredData.centerCoords[0];
                PhotmetryTable.variableStar.dec = structuredData.centerCoords[1];
                
                PhotmetryTable.onInit();
			}
	}
};
