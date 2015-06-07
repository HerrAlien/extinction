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
    size : 720,
    focalLength : 0,
    fov : 0,
    ra : 0,
    dec : 0,
    limittingMag : 0,
    namespace: "http://www.w3.org/2000/svg",
    image : document.getElementById("svgimage"),
    stars: [], // to be used later, when checking for collisions against the labels.
    starsDOM : null,
    labelsDOM : null,
    
    init : function (ra, dec, _fov_arcmin) {
        // clear it up first
        while (SVGChart.image.hasChildren())
            SVGChart.image.removeChild (SVGChart.image.firstChild);
        
        SVGChart.starsDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
        SVGChart.labelsDOM = SVGChart.image.ownerDocument.createElementNS (SVGChart.namespace, "g");
        SVGChart.image.appendChild (SVGChart.starsDOM);
        SVGChart.image.appendChild (SVGChart.labelsDOM);
        
        // save the data
        SVGChart.ra = ra;
        SVGChart.dec = dec;
        SVGChart.fov = _fov_arcmin;
        // knowing the size, now compute the focal length
        // w/2 = FL * tan (fov/2) => FL = w / 2 * tan (fov/2)
        SVGChart.focalLength = SVGChart.size / (2 * Math.tan ((_fov_arcmin / (2 * 60)) * Math.PI / 180));
    },
    
    updateStars : function (_stars) {
        SVGChart.stars = [];
        SVGChart.stars.concat (_stars);
        
        var i = 0;
        for (i = 0; i < _stars.length; i++) {
            SVGChart.drawStar (_stars[i]);
        }
    },
    
    drawStar : function (_elementToDrawTo, _star) {
        // compute the coordinates, in pixels
        // compute the radius
        // create a circle element, and that position, using that radius, filled black.
    },
    
    updateComparisonLabels : function (_stars) {
        var i = 0;
        for (i = 0; i < _stars.length; i++) {
            SVGChart.drawLabel (_stars[i]);
        }
    },
    
    drawLabel : function (_elementToDrawTo, _star) {
        // compute coordinates, in pixels
        // ... TODO: correct for collisions
        // set the cursor as pointer (style wise)
        // associate a function for the onclick event
    },
    
    radec2xy : function (ra, dec) {
        var dra_rad = (ra - SVGChart.ra) * Math.PI / 180;
        var ddec_rad = (dec - SVGChart.dec) * Math.PI / 180;
        return [SVGChart.focalLength * Math.tan (dra_rad), SVGChart.focalLength * Math.tan (ddec_rad)];
    }
};
