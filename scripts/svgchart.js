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

var SVGChart = {
    size : 500,
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
	borderDOM : null,
	centerMarkDOM : null,
    
    init : function (ra, dec, _fov_arcmin, _mag) {
        // clear it up first
        while (SVGChart.image.hasChildNodes())
            SVGChart.image.removeChild (SVGChart.image.firstChild);

		// clean up any left over references
		SVGChart.starsDOM = null;
		SVGChart.labelsDOM = null;
		SVGChart.borderDOM = null;
		SVGChart.centerMarkDOM = null;
	
        // save the data
        SVGChart.ra = ra;
        SVGChart.dec = dec;
        SVGChart.fov = _fov_arcmin / 60.0;
        SVGChart.limittingMag = _mag;
        // knowing the size, now compute the focal length
        // w/2 = FL * tan (fov/2) => FL = w / 2 * tan (fov/2)
        SVGChart.focalLength = SVGChart.size / (2 * Math.tan (SVGChart.fov * Math.PI / 360));
		
		SVGChart.starLabelClick.add (StarsSelection.setSelectedStar);
    },
	
	starLabelClick : {
		handlers : [],
		
		notify : function (selectedStar) {
			for (var i = 0; i < SVGChart.starLabelClick.handlers.length; i++){
				SVGChart.starLabelClick.handlers[i](selectedStar);
			}
		},
		// anybody can sign up to be notified.
		add : function (handlerToAdd) {
			SVGChart.starLabelClick.handlers.push (handlerToAdd);
		}
	},
    
    updateStars : function (_stars) {
        SVGChart.stars = _stars;
        SVGChart.stars.sort(function(a, b) { 
                if (a.mag < b.mag)
                    return -1;
                if (b.mag < a.mag)
                    return 1;
                return 0;
            } 
        );
        SVGChart.redrawStars();
    },
	
	redrawStars : function () {
		if (SVGChart.starsDOM)
			SVGChart.image.removeChild (SVGChart.starsDOM);
        SVGChart.starsDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
        SVGChart.image.appendChild (SVGChart.starsDOM);
		
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
        var radius = 1.1 * Math.pow (1.35, SVGChart.limittingMag - _star.mag);
        // create a circle element, and that position, using that radius, filled black.
        var circleElem = _elementToDrawTo.ownerDocument.createElementNS (SVGChart.namespace, "circle");
        _elementToDrawTo.appendChild (circleElem);
        circleElem.setAttribute ("cx", coords[0]);
        circleElem.setAttribute ("cy", coords [1]);
        circleElem.setAttribute ("r", radius);
        circleElem.setAttribute ("fill", "black");
        circleElem.setAttribute ("stroke", "white");
        circleElem.setAttribute ("stroke-width", 1);
    },
    
    updateComparisonLabels : function (_stars) {
		SVGChart.labels = _stars;
		SVGChart.redrawLabels();
	},
    
	redrawLabels : function () {
		if (SVGChart.labelsDOM)
			SVGChart.image.removeChild (SVGChart.labelsDOM);
        SVGChart.labelsDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
        SVGChart.image.appendChild (SVGChart.labelsDOM);		

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
		var radius = 1 * Math.pow (1.35, SVGChart.limittingMag - _star.mag);
		coords[0] += radius + 1;
		coords[1] += radius + 5;
		
		var textDOM = _elementToDrawTo.ownerDocument.createElementNS (SVGChart.namespace, "text");
		_elementToDrawTo.appendChild(textDOM);
		textDOM.setAttribute("x", coords[0]);
		textDOM.setAttribute("y", coords[1]);
		textDOM.textContent = _star.label;
		textDOM.style["fontSize"] = "10px";
		textDOM.style["fontFamily"] = "Arial";
        // ... TODO: correct for collisions
        // set the cursor as pointer (style wise)
		textDOM.style["cursor"] = "pointer";		
        // associate a function for the onclick event
		textDOM.onclick = function () { SVGChart.starLabelClick.notify (_star); }		
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
        
        var signX = 1; // west to the right
        if (SVGChart.chartOrientation == 1 || SVGChart.chartOrientation == 2)
            signX = -1; // east to the right
        
        var signY = 1; // north up
        if (SVGChart.chartOrientation == 1 || SVGChart.chartOrientation == 3)
            signY = -1; // south up

        return [SVGChart.size / 2 - signX * SVGChart.focalLength * Math.tan (dra_rad), 
                SVGChart.size / 2 - signY * SVGChart.focalLength * Math.tan (ddec_rad)];
    },
	
	drawCenterMark : function () {
		if (SVGChart.centerMarkDOM)
			SVGChart.image.removeChild (SVGChart.centerMarkDOM);
        SVGChart.centerMarkDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
        SVGChart.image.appendChild (SVGChart.centerMarkDOM);	
		var parentDOM = SVGChart.centerMarkDOM;

		var center = SVGChart.size / 2;
		var offset = 7;
		var line = parentDOM.ownerDocument.createElementNS(SVGChart.namespace, "line");
		parentDOM.appendChild (line);
        line.setAttribute ("x1", center - offset);
        line.setAttribute ("y1", center);
        line.setAttribute ("x2", center + offset);
        line.setAttribute ("y2", center);
        line.setAttribute ("stroke", "black");
        line.setAttribute ("stroke-width", 1);

		line = parentDOM.ownerDocument.createElementNS(SVGChart.namespace, "line");
		parentDOM.appendChild (line);
        line.setAttribute ("x1", center);
        line.setAttribute ("y1", center - offset);
        line.setAttribute ("x2", center);
        line.setAttribute ("y2", center + offset);
        line.setAttribute ("stroke", "black");
        line.setAttribute ("stroke-width", 1);
		
		var circleElem = parentDOM.ownerDocument.createElementNS (SVGChart.namespace, "circle");
        parentDOM.appendChild (circleElem);
        circleElem.setAttribute ("cx", SVGChart.size / 2);
        circleElem.setAttribute ("cy", SVGChart.size / 2);
        circleElem.setAttribute ("r", 3);
        circleElem.setAttribute ("fill", "white");
        circleElem.setAttribute ("stroke", "black");
        circleElem.setAttribute ("stroke-width", 1);
	},
	
	drawBorder : function () {
		
		if (SVGChart.borderDOM)
			SVGChart.image.removeChild (SVGChart.borderDOM);
		SVGChart.borderDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
		SVGChart.image.appendChild (SVGChart.borderDOM);
		var targetDOM = SVGChart.borderDOM;
		
		var half = SVGChart.size / 2;
		var margin = 1;
		var border = targetDOM.ownerDocument.createElementNS(SVGChart.namespace, "rect");
		targetDOM.appendChild (border);
		
		border.setAttribute ("x", margin);
		border.setAttribute ("y", margin);
		
		border.setAttribute ("width", SVGChart.size - 2 * margin);
		border.setAttribute ("height", SVGChart.size - 2 * margin);
		
		border.setAttribute ("stroke", "black");
		border.setAttribute ("stroke-width",  margin );
		
		border.setAttribute ("fill-opacity",  0);
		
		// now, draw NEWS ...
		var textSize = 10;
		var x = half;
		var y = 0; // north up
		if (SVGChart.chartOrientation == 1 || SVGChart.chartOrientation == 3)
			y = SVGChart.size - textSize; // south up
    SVGChart.drawCoordinateMarker ("N", x, y, textSize);
		
		y = half;
		x = 0; // west to the right
		if (SVGChart.chartOrientation == 1 || SVGChart.chartOrientation == 2)
			x = SVGChart.size - textSize; // east to the right
    SVGChart.drawCoordinateMarker ("E", x, y, textSize);

		x = SVGChart.size - textSize; //west to the right
		if (SVGChart.chartOrientation == 1 || SVGChart.chartOrientation == 2)
			x = 0; // east to the right
    SVGChart.drawCoordinateMarker ("W", x, y, textSize);

		x = half;
		y = SVGChart.size - textSize; // north up
		if (SVGChart.chartOrientation == 1 || SVGChart.chartOrientation == 3)
			y = 0; // south up
    SVGChart.drawCoordinateMarker ("S", x, y, textSize);
	},
	
	drawCoordinateMarker : function (textToPlace, posx, posy, size) {
		var targetDOM = SVGChart.borderDOM;
		var bg = targetDOM.ownerDocument.createElementNS(SVGChart.namespace, "rect");
		targetDOM.appendChild (bg);
		bg.setAttribute ("fill", "white");
		bg.setAttribute ("x", posx);
		bg.setAttribute ("y", posy);
		bg.setAttribute ("width", size);
		bg.setAttribute ("height", size);
		var txt = targetDOM.ownerDocument.createElementNS(SVGChart.namespace, "text");
		targetDOM.appendChild (txt);
		txt.setAttribute("x", posx + 1);
		txt.setAttribute("y", posy + 3 + size/2);
		txt.textContent = textToPlace;
		txt.style["fontSize"] = (size - 1) + "px";
		txt.style["fontFamily"] = "Arial";
	}
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
