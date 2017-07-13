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

/*
    Yet another model side class :)
    Same requirements as for the photometry table.
*/

var Hipparcos = {
    config : {
        method: "GET",
        url : "http://tapvizier.u-strasbg.fr/TAPVizieR/tap/sync",
        qstring : "proxyfor=vizieR&request=doQuery&format=json&lang=adql&phase=RUN&query="
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

        var pollURL = false;
        var data = Hipparcos.config.qstring + encodeURI(Hipparcos.buildAdqlQuery(ra_deg, dec_deg, fov_arcmin, maglim));

                
        var jobHttpRequest = new XMLHttpRequest({mozSystem: true});
        jobHttpRequest.onreadystatechange = function() {
            if(jobHttpRequest.readyState == 2) {
                pollURL = jobHttpRequest.getResponseHeader("Location");
                //Hipparcos.poll (pollURL);
            }
            if(jobHttpRequest.readyState == 4) {
                var jobdoc =  jobHttpRequest.responseText;
                if (jobdoc == ""){
                    // bad connection?
                    // TODO: should be a notification
                    Log.message ("Could not retrieve the position of stars; check your internet connection.");
                    return;
                }
                
                Hipparcos.ParseStarsFromText(jobdoc);
                Hipparcos.onStarsRetrieved.notify();
            }
        }
        jobHttpRequest.open("GET", Hipparcos.config.url+ "?" + data, true);
        jobHttpRequest.send(null);
    },
    
    buildAdqlQuery : function (ra_deg, dec_deg, fov_arcmin, maglim) {
        var fovDeg = fov_arcmin/60;
        var adqlQuery =  'SELECT "Vmag", "RA(ICRS)", "DE(ICRS)" FROM "I/239/tyc_main" WHERE "Vmag" < ' + maglim + 
                            ' and 1=CONTAINS(POINT(\'ICRS\',"I/239/tyc_main"."RA(ICRS)","I/239/tyc_main"."DE(ICRS)"), BOX(\'ICRS\', ' +
                            ra_deg + ', '+ dec_deg +', '+ fovDeg +', '+ fovDeg +'))';
        return adqlQuery;
    },
    
    sendRequest_debug : function (xmlHttpReq) {
        xmlHttpReq.open(Hipparcos.config_debug.method, 
                        Hipparcos.config_debug.url, 
                        true);
        xmlHttpReq.send(null); 
    },
 
    ParseStarsFromText : function (text) {
        var stars = [];

        var data = JSON.parse(text);
       
        for (var entryIndex in  data.data) {
            var entry = data.data[entryIndex];

            var starToAdd = { "ra" :  entry[1], 
                            "dec" : entry[2], 
                            "mag" : entry[0], 
                            "label" : "NA", 
                            "airmass" : 1 };
            stars.push (starToAdd);
        }
        
        Hipparcos.chart.stars = stars;
        return stars;
    }
};

Hipparcos.init();
