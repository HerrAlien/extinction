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

/* http://apm5.ast.cam.ac.uk/cgi-bin/wdb/hipp/tycho/query?max_rows_returned=1000&tab_dec=on&tab_ra=on&tab_box=on&tab_vtmag=on&box=10&ra=18.61578888888889&dec=-28.927722222222222&vtmag=<7
*/

/*
    Yet another model side class :)
    Same requirements as for the photometry table.
*/

var Hipparcos = {
    config : {
        method: "GET",
        url : "http://apm5.ast.cam.ac.uk/cgi-bin/wdb/hipp/tycho/query",
        params : [ "ra"  /* RA of the center of the square region to search in */, 
                   "dec" /* DEC of the center of the square region to search in */, 
                   "box" /* half size of the square region, in degrees */,
                   "vtmag" /* magnitude of the faintest star to be included */],
        columnDelimiter : "|"
    },
    
    config_debug : {
        method: "GET",
        url : "http://127.0.0.1:8080/resources/hip.htm"
    },
    
    chart : {
        stars : [],
        config : { "ra" : 0, "dec" : 0, "fov" : 0, "mag" : 0 }
    },
    
    onStarsRetrieved : false,
	
	init : function () {
		Hipparcos.onStarsRetrieved = Notifications.NewNoParameter();
	},
    
    setFrameData : function (ra_deg, dec_deg, fov_arcmin, maglim) {
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
                    // TODO: should be a notification
                    Log.message ("Could not retrieve the position of stars; check your internet connection.");
                    return;
                }
                Hipparcos.ParseStarsFromText (doc);
                Hipparcos.onStarsRetrieved.notify();
            }
        }
        Hipparcos.sendRequest (xmlHttpReq, ra_deg, dec_deg, fov_arcmin, maglim);
    },
    
    sendRequest : function (xmlHttpReq, ra_deg, dec_deg, fov_arcmin, maglim) {
        
        var queryString = "max_rows_returned=1000&tab_dec=on&tab_ra=on&tab_box=on&tab_vtmag=on&full_screen_mode=0&" +
                        Hipparcos.config.params[0] + "=" + ra_deg / 15.0 + "&" +
                        Hipparcos.config.params[1] + "=" + dec_deg + "&" +
                        Hipparcos.config.params[2] + "=" + fov_arcmin / 60.0 + "&" +
                        Hipparcos.config.params[3] + "=<" + maglim 
                        + "&proxyfor=casu-adc-tycho";
        
        xmlHttpReq.open(Hipparcos.config.method, Hipparcos.config.url + "?" + queryString, true);
        xmlHttpReq.send(null); 
    },
    
    sendRequest_debug : function (xmlHttpReq) {
        xmlHttpReq.open(Hipparcos.config_debug.method, 
                        Hipparcos.config_debug.url, 
                        true);
        xmlHttpReq.send(null); 
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
            var starToAdd = { "ra" :  Computations.parseCoordinate(columns[9].innerHTML, " ") * 15 , 
                            "dec" : Computations.parseCoordinate(columns[10].innerHTML, " "), 
                            "mag" : Computations.evalNum(columns[21].innerHTML), 
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
