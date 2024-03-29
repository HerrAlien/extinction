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

var Computations = {
    
    JD : function (timeStr) {
        
        var d = new Date (Date.parse (timeStr));
        
        var a = Math.floor((14 - (d.getMonth() + 1)) / 12);
        var y = d.getFullYear() + 4800 - a;
        var m = d.getMonth() + 1 + 12 * a - 3;
        
        var JDN = d.getDate() + Math.floor ((153 * m + 2) / 5) + 365 * y + 
                  Math.floor (y / 4) - Math.floor (y / 100) + Math.floor (y / 400) - 32045;
            
        return  JDN + (d.getHours() - 12) / 24 + d.getMinutes() / 1440 + d.getSeconds() / 86400;
    },
    
    LST : function (currentJD, longitude) {
        var nonNormedLST = 280.46061837 + 360.98564736629 * (currentJD - 2451545) + longitude;
        return nonNormedLST - 360 * Math.floor (nonNormedLST / 360);
    },
    
    LSTFromTimeString : function (timeStr, _long) {
        
        var currentJD = 0;
        if (timeStr.indexOf ("/") > 0 || timeStr.indexOf (":") > 0) { // assume a JD first
            currentJD = Computations.JD (timeStr);
        } else {
            currentJD = parseFloat (timeStr);
        }
        
       return Computations.LST (currentJD, _long);
    },
    
    Alt : function (_ra, _dec, _lst, _lat, _long) {

        var deg2rad = Math.PI / 180;

        var ra = _ra * deg2rad;
        var dec = _dec * deg2rad;
        var lat = _lat * deg2rad;
        var long = _long * deg2rad;
        var lst = _lst * deg2rad;

        return Math.asin (Math.sin (dec) * Math.sin (lat) + Math.cos (dec) * Math.cos (lat) * Math.cos (lst - ra)) * 180 / Math.PI;
    },
    
    Airmass : function (alt) {
        var cos_zt = Math.cos((90 - alt) * Math.PI / 180);

        return (1.002432 * Math.pow (cos_zt, 2) + 0.148386 * cos_zt + 0.0096467) / 
               (Math.pow (cos_zt, 3) + 0.149864 * Math.pow(cos_zt, 2) + 0.0102963 * cos_zt + 0.000303978);
    },
    
    Round : function (num, decimals) {
        if (num == 0)
            return 0;
        
        var _10PoweredByDecimals = Math.pow(10, decimals);
        var n = Math.floor (num * _10PoweredByDecimals + 0.5) + 0.0000000001;
        n = n / _10PoweredByDecimals;
        var nstr = n + "";
        // locate the decimal point
        var dotIsAt = nstr.indexOf (".");
        var slicedNum = nstr;
		if (dotIsAt > 0)
			slicedNum = nstr.slice (0, dotIsAt + decimals + 1);
        return Computations.evalNum (slicedNum);
    },
    
    AverageAndStdDev : function (data) {
        var res = {"avg" : 0, "stdDev" : 0 };
        
        var i = 0;
        for (i = 0; i < data.length; i++)
            res.avg = res.avg + data [i];
        
        if (data.length > 0)
            res.avg = res.avg / data.length;
        
        var variation = 0;
        for (i = 0; i < data.length; i++)
            variation = variation + (data [i] - res.avg) * (data [i] - res.avg);
        
        res.stdDev = Math.sqrt (variation);
        
        return res;
    },
	
	evalNum : function (thingToEval) {
		if (isNaN(thingToEval))
			throw (thingToEval + " is not a number!");
		return thingToEval * 1;
	},
    
    parseCoordinate : function (coord, separator) {
            if (!isNaN(coord))
                return coord;
            
            var comps = coord.split(separator);
            var sign = 1.0;
            if (comps[0] * 1.0 < 0)
                sign = -1.0;

            return comps[0]*1.0 + sign*comps[1]/60.0 + sign*comps[2]/3600.0;
    },
	
	CompareStats : function (statsWOMe, statsWithMe, thresholdsObj) {
        var rating = 2;
        if (statsWOMe.stdDev > 0){
            if ( Math.abs(statsWOMe.avg - statsWithMe.avg) < /*0.5*/ thresholdsObj.avgStdDevRatio * statsWOMe.stdDev )
                rating = 2;
            else if ( Math.abs(statsWOMe.avg - statsWithMe.avg) < statsWOMe.stdDev )
                rating = 1;
            else
                rating = 0;
        } else {
            if (statsWithMe.stdDev < thresholdsObj.stdDevAbsError)
                rating = 2;
            else if (statsWithMe.stdDev < thresholdsObj.stdDevMaxAbsError)
                rating = 1;
            else
                rating = 0;
        }
        return rating;
    }
};

try {
    Initialization.init();
} catch (err) {
}
