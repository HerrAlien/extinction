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

/* http://apm5.ast.cam.ac.uk/cgi-bin/wdb/hipp/tycho/query?max_rows_returned=1000&tab_dec=on&tab_ra=on&tab_box=on&tab_vtmag=on&box=10&ra=18.61578888888889&dec=-28.927722222222222&vtmag=<7
*/

var Hipparcos = {
    config : {
        method: "GET",
        url : "http://tapvizier.u-strasbg.fr/adql/",
        /*! $1 - limiting magnitude
            $2 - lower RA limit
            $3 - upper RA limit
            $4 - lower DEC limit
            $5 - upper DEC limit
        */
        sql : {
            __query__ : "SELECT \"RA(ICRS)\", \"DE(ICRS)\", \"Vmag\" FROM \"I/239/tyc_main\" WHERE \"Vmag\" < $1 and \"RA(ICRS)\" > $2 and \"RA(ICRS)\" < $3 and \"DE(ICRS)\" > $4 and \"DE(ICRS)\" < $5",
            getQuery : function (vmag, ramin, ramax, decmin, decmax){
                var q = this.__query__.replace ("$1", vmag);
                q = q.replace ("$2", ramin);
                q = q.replace ("$3", ramax);
                q = q.replace ("$4", decmin);
                return q.replace ("$5", decmaz);
            }
        }
    },
    
    config_debug : {
        method: "GET",
        url : "http://127.0.0.1:8080/resources/hip.htm"
    },
    
    chart : {
        stars : [],
        config : { "ra" : 0, "dec" : 0, "fov" : 0, "mag" : 0 }
    },
    
    init : function (ra_deg, dec_deg, fov_arcmin, maglim) {
        var xmlHttpReq = new XMLHttpRequest({mozSystem: true});
        Hipparcos.chart.config.ra = ra_deg;
        Hipparcos.chart.config.dec = dec_deg;
        Hipparcos.chart.config.fov = fov_arcmin;
        Hipparcos.chart.config.mag = maglim;
        xmlHttpReq.onreadystatechange = function() {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;
                if (doc == ""){
                    // bad connection?
                    Log.message ("Could not retrieve the position of stars; check your internet connection.");
                    return;
                }
                Hipparcos.ParseStarsFromText (doc);
                Hipparcos.onInit();
            }
        }
        Hipparcos.sendRequest (xmlHttpReq, ra_deg, dec_deg, fov_arcmin, maglim);
    },
    
    sendRequest : function (xmlHttpReq, ra_deg, dec_deg, fov_arcmin, maglim) {
        
        var queryString = "max_rows_returned=1000&tab_dec=on&tab_ra=on&tab_box=on&tab_vtmag=on&full_screen_mode=0&" +
                        Hipparcos.config.params[0] + "=" + ra_deg / 15.0 + "&" +
                        Hipparcos.config.params[1] + "=" + dec_deg + "&" +
                        Hipparcos.config.params[2] + "=" + fov_arcmin / 60.0 + "&" +
                        Hipparcos.config.params[3] + "=<" + maglim + 
                        
                        "&proxyfor=casu-adc-tycho";
        
        xmlHttpReq.open(Hipparcos.config.method, Hipparcos.config.url + "?" + queryString, true);
        xmlHttpReq.send(null); 
    },
    
    sendRequest_debug : function (xmlHttpReq) {
        xmlHttpReq.open(Hipparcos.config_debug.method, 
                        Hipparcos.config_debug.url, 
                        true);
        xmlHttpReq.send(null); 
    },

    onInit : function () {
        
    },
    
    ParseStarsFromText : function (text) {
        var stars = [];

        var parser=new DOMParser();
        var xmlDoc=parser.parseFromString(text,"text/html");
        var entries = xmlDoc.getElementsByTagName("tr");
        
        var rowIndex = 0;
        for (; rowIndex < entries.length; rowIndex++) {
            var row = entries[rowIndex];
            var columns = row.getElementsByTagName("td");
            if (columns.length == 0)
                continue;
            // ra - 9 
            // dec - 10 
            // Vmag - 21
            var starToAdd = { "ra" :  Computations.parseCoordinate(columns[3].innerHTML, " ") * 15 , 
                            "dec" : Computations.parseCoordinate(columns[4].innerHTML, " "), 
                            "mag" : Computations.evalNum(columns[15].innerHTML), 
                            "label" : "NA", 
                            "airmass" : 1 };
            stars.push (starToAdd);
        }
        
        Hipparcos.chart.stars = stars;
        return stars;
    }
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
