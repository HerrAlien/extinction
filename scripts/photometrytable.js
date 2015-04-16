////     //*[@id="content-content"]/table[1]/tbody/tr[2]/td[2]/font

var PhotmetryTable = {
    
    searchTree : {        
        root : null,
        
        settings : {
            maxFovPerNode : 10 // this is in arcmins
        },
        
        getClosestStar : function(ra, dec) {
            var foundStar = { "ra": ra, "dec": dec, "mag" : "n/a", "label" : "n/a" };
            // this gets filled with the result of the search
            
            var closestStars = PhotmetryTable.searchTree.root.GetStarsAt ([ra, dec]);
            
            // loop through them, return the one closest to input param
            var i = 0;
            var distanceSqrMin = 999999999;
            var currentSqrDistance = 0;
            var diffRA = 0;
            var diffDec = 0;
            for (i = 0; i < closestStars.length; i++) {
                diffRA = ra - closestStars[i]["ra"];
                diffDec = dec - closestStars[i]["dec"];
                currentSqrDistance = diffRA * diffRA + diffDec * diffDec;
                if (currentSqrDistance < distanceSqrMin) {
                    distanceSqrMin = currentSqrDistance;
                    foundStar = closestStars[i];
                }
            }
            
            return foundStar;
        },
        
        node : function (coords, fov, stars) {
            this.sons = [];
            this.coords = coords;
            this.fov = fov * 1.1; // this is to overlap a bit with neighbors
            this.stars = [];
            
            this.hasCoords = function (radec) {
                var halfFOV = 0.5 * this.fov; 
                return ((radec[0] > coords[0] - halfFOV && radec [0] < coords[0] + halfFOV) &&
                        (radec[1] > coords[1] - halfFOV && radec [1] < coords[1] + halfFOV))
            };
            
            this.GetStarsAt = function (radec) {
                if (this.hasCoords(radec)){
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
            };
            
            // do an initial fill here; this acts as filter for sons
            var i = 0;
            for (; i < stars.length; i++)
                if (this.hasCoords ( [stars[i]["ra"], stars[i]["dec"] ) )
                    this.stars.append (stars[i]);
            
            // now that we bit a little more, we can set back the FOV
            this.fov = fov;
            if (this.fov > PhotmetryTable.searchTree.settings.maxFovPerNode * 1.1) {
                var sonsFOV = this.fov * 0.5;
                this.sons.append (new PhotmetryTable.searchTree.node ( [coords[0] + sonsFOV, coords[1] + sonsFOV] , sonsFOV, this.stars));
                this.sons.append (new PhotmetryTable.searchTree.node ( [coords[0] - sonsFOV, coords[1] - sonsFOV] , sonsFOV, this.stars));
                this.sons.append (new PhotmetryTable.searchTree.node ( [coords[0] + sonsFOV, coords[1] - sonsFOV] , sonsFOV, this.stars));
                this.sons.append (new PhotmetryTable.searchTree.node ( [coords[0] - sonsFOV, coords[1] + sonsFOV] , sonsFOV, this.stars));
                this.stars = []; // all stars were passed along to the sons
            }
        },
        
        init : function (data, mag) {
            // create the quad tree
            PhotmetryTable.searchTree.root = new PhotmetryTable.searchTree.node (data.centerCoords, data.fov, data.stars);
        }
    },
    
    // namespace holding utilities to access the VSP data
    AAVSO : {
        config: { // 
            url : "http://www.aavso.org/cgi-bin/vsp.pl?ccdtable=on&chartid=",
            method: "GET"
        },
        
        GetData : function (text) {
            var data = {
                centerCoords : [0, 0],
                fov : 400,
                stars : []
            };
            text = text.toLowerCase();
            // locate the FOV and center coords
            
            data.fov = PhotmetryTable.AAVSO.GetFOV (text);
            data.centerCoords = PhotmetryTable.AAVSO.GetCoords(text);
            data.stars = PhotmetryTable.AAVSO.GetStars (text);
        },
        
        GetFOV : function (text) {
            var fovBegins = text.indexOf ("within ") + 7; // length of string
            return eval (text.substr (fovBegins, 7));
        },
        
        GetCoords : function (text) {
            var numberStartsAt = text.indexOf (" (") + 2;
            var numberEndsAt = text.indexOf (")</font>");
            var ra = eval (text.substring (numberStartsAt, numberEndsAt));
            
            var decText = text.substring (numberEndsAt + 1);
            numberStartsAt = decText.indexOf (" (") + 2;
            numberEndsAt = decText.indexOf (")</font>");
            var dec = eval (decText.substring (numberStartsAt, numberEndsAt));
            
            return [ra, dec];
        },
        
        GetStars : function (text) {
            var stars = [];
            // parse the DOM
            // but first, insert it in the doc
            var hostElement = document.createElement ("div");
            hostElement.style.display = "none";
            hostElement.innerHTML = text;
            // get the table
            var table = hostElement.getElementsByTagName("table")[0];
            
            var extractNumericalValue = function (str, begin, end) {
                var valueStartsAt = str.indexOf (begin) + begin.length;
                var valueEndsAt =  str.indexOf (end);
                return eval (str.substring (valueStartsAt, valueEndsAt));
            };
            
            var i = 0;
            for (i = 0; i < table.rows.length; i++) {
                var currentRow = table.rows[i];
                var ra = extractNumericalValue (currentRow.cells[1].innerHTML, " [", "d]");
                var dec = extractNumericalValue (currentRow.cells[2].innerHTML, " [", "d]");
                var label = extractNumericalValue (currentRow.cells[3].innerHTML, "<b>", "</b>");
                var mag = extractNumericalValue (currentRow.cells[6].innerHTML, "size=-1>", " (");
                stars.append ( { "ra": ra, "dec": dec, "mag" : mag, "label" : label } );
            }
            
            delete hostElement;
            return stars;
        }
        
    },

    init : function (chartID, limittingMag) {
        var xmlHttpReq = new XMLHttpRequest();
        xmlHttpReq.onreadystatechange = function() {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;
                var structuredData  = PhotmetryTable.AAVSO.GetData (doc);
                PhotmetryTable.searchTree.init (structuredData, limittingMag);
            }
        }
        xmlHttpReq.open(PhotmetryTable.AAVSO.config.method, PhotmetryTable.AAVSO.config.url + chartID, true);
        xmlHttpReq.send(null);              
    }
};
