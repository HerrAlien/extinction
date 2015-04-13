////     //*[@id="content-content"]/table[1]/tbody/tr[2]/td[2]/font

var PhotmetryTable = {
    
    centerCoords : [],
    fov : 0,
    
    searchTree : {
        getClosestStar : function(ra, dec) {
            var foundStar = { "ra": ra, "dec": dec, "mag" : 0 };
            // this gets filled with the result of the search
            return foundStar;
        },
        
        init : function (coords, span, mag) {
            alert ("Init at " + cords[0] + ", " + coords[1]);
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
        PhotmetryTable.fov = FOV;
        var xmlHttpReq = new XMLHttpRequest();
        xmlHttpReq.onreadystatechange = function() {
            if(xmlHttpReq.readyState == 4) {
                var doc =  xmlHttpReq.responseText;

                PhotmetryTable.centerCoords  = PhotmetryTable.AAVSO.GetCenter (doc);

                PhotmetryTable.searchTree.init (PhotmetryTable.centerCoords, FOV, limittingMag);
            }
        }
        xmlHttpReq.open(PhotmetryTable.AAVSO.config.method, PhotmetryTable.AAVSO.config.vsxFormURL+ encodeURI(starName), true);
        xmlHttpReq.send(null);              
    }
};
