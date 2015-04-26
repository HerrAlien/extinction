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
        var _10PoweredByDecimals = Math.pow(10, decimals);
        var n = Math.floor (num * _10PoweredByDecimals + 0.5);
        n = n / _10PoweredByDecimals;
        var nstr = n + "0000000000000000000000000";
        // locate the decimal point
        var dotIsAt = nstr.indexOf (".");
        var slicedNum = nstr.slice (0, dotIsAt + decimals + 1);
        return eval (slicedNum);
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
    }
};
