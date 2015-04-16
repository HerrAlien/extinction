////     //*[@id="content-content"]/table[1]/tbody/tr[2]/td[2]/font

var PhotmetryTable = {
    
    searchTree : {        
        root : null,
        
        settings : {
            maxFovPerNode : 10 // this is in arcmins
        },
        
        getClosestStar : function(ra, dec) {
            var foundStar = { "ra": ra, "dec": dec, "mag" : 0 };
            // this gets filled with the result of the search
            
            var closestStars = PhotmetryTable.searchTree.root.GetStarsAt ([ra, dec]);
            
            // loop through them, return the one closest to input param
            var i = 0;
            for (i = 0; i < )
            
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
        
        init : function (coords, fov, mag) {
            alert ("Init at " + cords[0] + ", " + coords[1]);
            // T0DO: prepare a list of stars, up to mag
            var stars = [];
            
            // then create the quad tree
            PhotmetryTable.searchTree.root = new PhotmetryTable.searchTree.node (coords, fov, stars);
        }
    },
    
    // namespace holding utilities to access the VSX
    AAVSO : {
        config: { // 
            vsxFormURL : "http://www.aavso.org/vsx/index.php?view=results.submit1&order=0&constid=0&ql=1&filter[]=0&ident=",
            method: "GET"
        },
        
        GetCenter : function (text) {
            
            var beginAt = text.indexOf ("J2000.0");
            if (beginAt < 0)
                throw "Could not find start tag";
            
            var textToInset = text.substring (beginAt);
            beginAt = textToInset.indexOf ("<table");
             if (beginAt < 0)
                throw "Could not find start tag";
            
            var endAt = textToInset.indexOf ("</table>");
            if (endAt < 0)
                return null;
            endAt = eval (endAt + 8 /* the </table> */);
            
            textToInset = textToInset.substring (beginAt, endAt);
            
            beginAt = textToInset.indexOf("(");
            endAt = textToInset.indexOf(")");
            
            textToInset = textToInset.substring (beginAt + 1, endAt);
            
            var indexOfSpace = textToInset.indexOf(" ");
            
            return [eval(textToInset.substring (0, indexOfSpace)), eval(textToInset.substring (indexOfSpace))];            
        }
        
    },

    init : function (starName, FOV, limittingMag) {
        var xmlHttpReq = new XMLHttpRequest();
        xmlHttpReq.onreadystatechange = function() {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;
                var centerCoords  = PhotmetryTable.AAVSO.GetCenter (doc);
                PhotmetryTable.searchTree.init (centerCoords, FOV, limittingMag);
            }
        }
        xmlHttpReq.open(PhotmetryTable.AAVSO.config.method, PhotmetryTable.AAVSO.config.vsxFormURL+ encodeURI(starName), true);
        xmlHttpReq.send(null);              
    }
};
