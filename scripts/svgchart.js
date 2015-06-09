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

var SVGChart = {
    size : 600,
    focalLength : 0,
    fov : 0,
    ra : 0,
    dec : 0,
    chartOrientation : 0,
    limittingMag : 0,
    namespace: "http://www.w3.org/2000/svg",
    image : document.getElementById("svgimage"),
    stars: [], // to be used later, when checking for collisions against the labels.
	labels : [],
    starsDOM : null,
    labelsDOM : null,
    
    init : function (ra, dec, _fov_arcmin, _mag) {
        // clear it up first
        while (SVGChart.image.hasChildNodes())
            SVGChart.image.removeChild (SVGChart.image.firstChild);
        
        SVGChart.starsDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
        SVGChart.labelsDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
        SVGChart.image.appendChild (SVGChart.starsDOM);
        SVGChart.image.appendChild (SVGChart.labelsDOM);
        
        // save the data
        SVGChart.ra = ra;
        SVGChart.dec = dec;
        SVGChart.fov = _fov_arcmin / 60.0;
        SVGChart.limittingMag = _mag;
        // knowing the size, now compute the focal length
        // w/2 = FL * tan (fov/2) => FL = w / 2 * tan (fov/2)
        SVGChart.focalLength = SVGChart.size / (2 * Math.tan (SVGChart.fov * Math.PI / 360));
    },
    
    updateStars : function (_stars) {
        SVGChart.stars = _stars;
        SVGChart.redrawStars();
    },
	
	redrawStars : function () {
		while (SVGChart.starsDOM.hasChildNodes())
            SVGChart.starsDOM.removeChild (SVGChart.starsDOM.firstChild);
		
        var i = 0;
        for (i = 0; i < SVGChart.stars.length; i++) {
            SVGChart.drawStar (SVGChart.starsDOM, SVGChart.stars[i]);
        }
	},
    
    drawStar : function (_elementToDrawTo, _star) {
		if (!SVGChart.isStarVisible(_star))
			return;
        // compute the coordinates, in pixels
        var coords = SVGChart.radec2xy (_star.ra, _star.dec);
        // compute the radius
        var radius = 1 * Math.pow (1.35, SVGChart.limittingMag - _star.mag);
        // create a circle element, and that position, using that radius, filled black.
        var circleElem = _elementToDrawTo.ownerDocument.createElementNS (SVGChart.namespace, "circle");
        _elementToDrawTo.appendChild (circleElem);
        circleElem.setAttribute ("cx", coords[0]);
        circleElem.setAttribute ("cy", coords [1]);
        circleElem.setAttribute ("r", radius);
        circleElem.setAttribute ("fill", "black");
    },
    
    updateComparisonLabels : function (_stars) {
		SVGChart.labels = _stars;
		SVGChart.redrawLabels();
	},
    
	redrawLabels : function () {
		while (SVGChart.labelsDOM.hasChildNodes())
            SVGChart.labelsDOM.removeChild (SVGChart.labelsDOM.firstChild);
		
		var i = 0;
        for (i = 0; i < SVGChart.labels.length; i++) {
            SVGChart.drawLabel (SVGChart.labelsDOM, SVGChart.labels[i]);
        }
	},
	
    drawLabel : function (_elementToDrawTo, _star) {
		if (!SVGChart.isStarVisible(_star))
			return;
		
        // compute coordinates, in pixels
		var coords = SVGChart.radec2xy (_star.ra, _star.dec);
		coords[0] += 3;
		coords[1] += 7;
		
		var textDOM = _elementToDrawTo.ownerDocument.createElementNS (SVGChart.namespace, "text");
		_elementToDrawTo.appendChild(textDOM);
		textDOM.setAttribute("x", coords[0]);
		textDOM.setAttribute("y", coords[1]);
		textDOM.textContent = _star.label;
		textDOM.style["fontSize"] = "11px";
		textDOM.style["fontFamily"] = "Arial";
        // ... TODO: correct for collisions
        // set the cursor as pointer (style wise)
		textDOM.style["cursor"] = "pointer";		
        // associate a function for the onclick event
		textDOM.onclick = (function (_s) {
			var comparisonStar = _s;
			return function () {
				StarsSelection.setSelectedStar (comparisonStar);
			}
		})(_star);
	},
	
	isStarVisible : function (_star) {
		var halfFov = SVGChart.fov / 2;
		return (_star.mag <= SVGChart.limittingMag) &&
			   (_star.ra >= SVGChart.ra - halfFov) && 
			   (_star.ra <= SVGChart.ra + halfFov) && 
			   (_star.dec >= SVGChart.dec - halfFov) && 
			   (_star.dec <= SVGChart.dec + halfFov); 
	},
    
    radec2xy : function (ra, dec) {
        var dra_rad = (ra - SVGChart.ra) * Math.PI / 180;
        var ddec_rad = (dec - SVGChart.dec) * Math.PI / 180;
        
        var signX = 1;
        if (SVGChart.chartOrientation != 0)
            signX = -1;
        
        var signY = 1;
        if (SVGChart.chartOrientation == 1)
            signY = -1;

        return [SVGChart.size / 2 - signX * SVGChart.focalLength * Math.tan (dra_rad), 
                SVGChart.size / 2 - signY * SVGChart.focalLength * Math.tan (ddec_rad)];
    }
};
