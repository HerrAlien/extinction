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

var Hipparcos = {
    config : {
        method: "GET",
        url : "http://www.rssd.esa.int/hipparcos_scripts/HIPcatalogueSearch.pl",
        params : [ "raDecim"  /* RA of the center of the square region to search in */, 
                   "decDecim" /* DEC of the center of the square region to search in */, 
                   "box" /* half size of the square region, in degrees */,
                   "threshold" /* magnitude of the faintest star to be included */],
        columnDelimiter : "|"
    },
    
    stars : [],
    
    init : function (ra_deg, dec_deg, fov_arcmin, maglim) {
        var xmlHttpReq = new XMLHttpRequest();
        xmlHttpReq.onreadystatechange = function() {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;
                Hipparcos.ParseStarsFromText (doc);
                Hipparcos.onInit();
            }
        }
        xmlHttpReq.open(Hipparcos.config.method, 
                        Hipparcos.config.url + "?" +
                        Hipparcos.config.params[0] + "=" + ra_deg + "&" +
                        Hipparcos.config.params[1] + "=" + dec_deg + "&" +
                        Hipparcos.config.params[2] + "=" + fov_arcmin / 120 + "&" +
                        Hipparcos.config.params[3] + "=" + maglim , true);
        xmlHttpReq.send(null); 
    },
    
    onInit : function () {
        
    },
    
    ParseStarsFromText : function (text) {
        var stars = Hipparcos.stars;
        stars = [];
        // first, locate the tycho section ("Tycho Catalogue Data")
        var tycoBeginsAt = text.indexOf ("Tycho Catalogue Data");
        var tychoText = text.substring(tycoBeginsAt);
        // the line starts with a "T|"; the T is at column 0.
        var lineBeginsAt = tychoText.indexOf("T|");
        do {
            tychoText = tychoText.substring(lineBeginsAt);
            var i = 0;
            var starToAdd = { "ra" : 0, "dec" : 0, "mag" : 0, "label" : null, "airmass" : 1 };
            for (i = 0; i < 10; i++) {
                var column = Hipparcos.extractColumn (tychoText);
                tychoText = column.remaining;
                //  columns of interest: 
                switch (i) {
                    case 1: starToAdd.label = column.value; break;
                    //   * T5: V-band magnitude of the star
                    case 5: starToAdd.mag = column.value; break;
                    //   * T8: RA in degrees
                    case 8: starToAdd.ra = column.value; break;
                    //   * T9: DEC in degrees
                    case 9: starToAdd.dec = column.value; break;
                }
            }
            stars.push (starToAdd);
            // the line starts with a "T|"; the T is at column 0.
            lineBeginsAt = parsedText.indexOf("T|");
        } while (lineBeginsAt > 0);
        
        return stars;
    },
    
    extractColumn : function (str) {
        var res = {"value" : 0, "remaining": null };
        var beginsAt = str.indexOf (Hipparcos.config.columnDelimiter) +
                        Hipparcos.config.columnDelimiter.length;
        var valStr = str.substring (beginsAt);
        var endsAt = valStr.indexOf (Hipparcos.config.columnDelimiter);
        res.remaining = valStr;
        try {
            res.value = Computations.evalNum (valStr.substring(0, endsAt));
        } catch (err) {
            res.value = valStr.substring(0, endsAt);
        }
        return res;
    }    
};
