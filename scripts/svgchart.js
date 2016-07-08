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

/*
    Mostly view, so it needs to subscribe to events launched by the model side:
        - the photometry table, to redraw labels
        - the other stars, from HIPPARCOS

    It exposes the "on star label clicked" event, for others to subscribe to it.
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
    
    setFrameData : function (ra, dec, _fov_arcmin, _mag) {
        this.clear();
        // save the data
        this.ra = ra;
        this.dec = dec;
        this.fov = _fov_arcmin / 60.0;
        this.limittingMag = _mag;
        // knowing the size, now compute the focal length
        // w/2 = FL * tan (fov/2) => FL = w / 2 * tan (fov/2)
        this.focalLength = this.size / (2 * Math.tan (this.fov * Math.PI / 360));
    },
    
    clear : function () {
        // clear it up first
        while (this.image.hasChildNodes())
            this.image.removeChild (this.image.firstChild);

		// clean up any left over references
		this.starsDOM = null;
		this.labelsDOM = null;
		this.borderDOM = null;
		this.centerMarkDOM = null;
        this.drawBorder();
    },
	
	starLabelClick : {
		handlers : [],
		
		notify : function (selectedStar) {
			for (var i = 0; i < this.handlers.length; i++){
				this.handlers[i](selectedStar);
			}
		},
		// anybody can sign up to be notified.
		add : function (handlerToAdd) {
			this.handlers.push (handlerToAdd);
		}
	},
    
    setStars : function (_stars) {
        this.stars = _stars;
        this.stars.sort(function(a, b) { 
                if (a.mag < b.mag)
                    return -1;
                if (b.mag < a.mag)
                    return 1;
                return 0;
            } 
        );
    },
	
	redrawStars : function () {
		if (this.starsDOM)
			this.image.removeChild (this.starsDOM);
        this.starsDOM = this.image.ownerDocument.createElementNS (this.namespace, "g");
        this.image.appendChild (this.starsDOM);
		
        var i = 0;
        for (i = 0; i < this.stars.length; i++) {
            this.drawStar (this.starsDOM, this.stars[i]);
        }
	},
    
    drawStar : function (_elementToDrawTo, _star) {
		if (!this.isStarVisible(_star))
			return;
        // compute the coordinates, in pixels
        var coords = this.radec2xy (_star.ra, _star.dec);
        // compute the radius
        var radius = 1.1 * Math.pow (1.35, this.limittingMag - _star.mag);
        // create a circle element, and that position, using that radius, filled black.
        var circleElem = _elementToDrawTo.ownerDocument.createElementNS (this.namespace, "circle");
        _elementToDrawTo.appendChild (circleElem);
        circleElem.setAttribute ("cx", coords[0]);
        circleElem.setAttribute ("cy", coords [1]);
        circleElem.setAttribute ("r", radius);
        circleElem.setAttribute ("fill", "black");
        circleElem.setAttribute ("stroke", "white");
        circleElem.setAttribute ("stroke-width", 1);
    },
    
	redrawLabels : function () {
		if (this.labelsDOM)
			this.image.removeChild (this.labelsDOM);
        this.labelsDOM = this.image.ownerDocument.createElementNS (this.namespace, "g");
        this.image.appendChild (this.labelsDOM);		

		var i = 0;
        for (i = 0; i < this.labels.length; i++) {
            this.drawLabel (this.labelsDOM, this.labels[i]);
        }
	},
	
    drawLabel : function (_elementToDrawTo, _star) {
		if (!this.isStarVisible(_star))
			return;
		
        // compute coordinates, in pixels
		var coords = this.radec2xy (_star.ra, _star.dec);
		var radius = 1 * Math.pow (1.35, this.limittingMag - _star.mag);
		coords[0] += radius + 1;
		coords[1] += radius + 5;
		
		var textDOM = _elementToDrawTo.ownerDocument.createElementNS (this.namespace, "text");
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
		var halfFov = this.fov / 2;
		return (_star.mag <= this.limittingMag) &&
			   (_star.ra >= this.ra - halfFov) && 
			   (_star.ra <= this.ra + halfFov) && 
			   (_star.dec >= this.dec - halfFov) && 
			   (_star.dec <= this.dec + halfFov); 
	},
    
    radec2xy : function (ra, dec) {
        var dra_rad = (ra - this.ra) * Math.PI / 180;
        var ddec_rad = (dec - this.dec) * Math.PI / 180;
        
        var signX = 1; // west to the right
        if (this.chartOrientation == 1 || this.chartOrientation == 2)
            signX = -1; // east to the right
        
        var signY = 1; // north up
        if (this.chartOrientation == 1 || this.chartOrientation == 3)
            signY = -1; // south up

        return [this.size / 2 - signX * this.focalLength * Math.tan (dra_rad), 
                this.size / 2 - signY * this.focalLength * Math.tan (ddec_rad)];
    },
	
	drawCenterMark : function () {
		if (this.centerMarkDOM)
			this.image.removeChild (this.centerMarkDOM);
        this.centerMarkDOM = this.image.ownerDocument.createElementNS (this.namespace, "g");
        this.image.appendChild (this.centerMarkDOM);	

		var center = SVGChart.size / 2;
		var offset = 7;
		
        this.Draw.line (this.centerMarkDOM, center - offset, center, center + offset, center, "black", 1);
        this.Draw.line (this.centerMarkDOM, center, center - offset, center, center + offset, "black", 1);
		
		var circleElem = this.centerMarkDOM.ownerDocument.createElementNS (this.namespace, "circle");
        this.centerMarkDOM.appendChild (circleElem);
        circleElem.setAttribute ("cx", center);
        circleElem.setAttribute ("cy", center);
        circleElem.setAttribute ("r", 3);
        circleElem.setAttribute ("fill", "white");
        circleElem.setAttribute ("stroke", "black");
        circleElem.setAttribute ("stroke-width", 1);
	},
	
	drawBorder : function () {
		
		if (this.borderDOM)
			this.image.removeChild (this.borderDOM);
		this.borderDOM = this.image.ownerDocument.createElementNS (this.namespace, "g");
		this.image.appendChild (this.borderDOM);

		var margin = 1;
        var lineLen = SVGChart.size - margin;
        this.Draw.line(this.borderDOM, margin, margin, lineLen, margin, "black", margin);
        this.Draw.line(this.borderDOM, margin, margin, margin, lineLen, "black", margin);
        this.Draw.line(this.borderDOM, lineLen, lineLen, lineLen, margin, "black", margin);
        this.Draw.line(this.borderDOM, lineLen, lineLen, margin, lineLen, "black", margin);
                
		// now, draw NEWS ...
        var half = this.size/2;
		var textSize = 10;
		var x = half;
		var y = 0; // north up
		if (this.chartOrientation == 1 || this.chartOrientation == 3)
			y = this.size - textSize; // south up
        this.Draw.coordinateMarker (this.borderDOM, "N", x, y, textSize);
		
		y = half;
		x = 0; // west to the right
		if (this.chartOrientation == 1 || this.chartOrientation == 2)
			x = this.size - textSize; // east to the right
        this.Draw.coordinateMarker (this.borderDOM, "E", x, y, textSize);

		x = this.size - textSize; //west to the right
		if (this.chartOrientation == 1 || this.chartOrientation == 2)
			x = 0; // east to the right
        this.Draw.coordinateMarker (this.borderDOM, "W", x, y, textSize);

		x = half;
		y = this.size - textSize; // north up
		if (this.chartOrientation == 1 || this.chartOrientation == 3)
			y = 0; // south up
        this.Draw.coordinateMarker (this.borderDOM, "S", x, y, textSize);
	},
	
    redraw : function () {
        this.redrawStars();
        this.drawCenterMark();
    	this.redrawLabels ();
        this.drawBorder ();
    },
    
    Draw : { 
        line : function (parent, x1, y1, x2, y2, color, width){
            var line = parent.ownerDocument.createElementNS(SVGChart.namespace, "line");
            parent.appendChild (line);
            line.setAttribute ("x1", x1);
            line.setAttribute ("y1", y1);
            line.setAttribute ("x2", x2);
            line.setAttribute ("y2", y2);
            line.setAttribute ("stroke", color);
            line.setAttribute ("stroke-width", width);
            parent.appendChild (line);
        },
        
        coordinateMarker : function (parent, textToPlace, posx, posy, size) {
            var bg = parent.ownerDocument.createElementNS(SVGChart.namespace, "rect");
            parent.appendChild (bg);
            bg.setAttribute ("fill", "white");
            bg.setAttribute ("x", posx);
            bg.setAttribute ("y", posy);
            bg.setAttribute ("width", size);
            bg.setAttribute ("height", size);
            var txt = parent.ownerDocument.createElementNS(SVGChart.namespace, "text");
            parent.appendChild (txt);
            txt.setAttribute("x", posx + 1);
            txt.setAttribute("y", posy + 3 + size/2);
            txt.textContent = textToPlace;
            txt.style["fontSize"] = (size - 1) + "px";
            txt.style["fontFamily"] = "Arial";
        }
        
    }
};

try {
    Initialization.init();
} catch (err) {
}
