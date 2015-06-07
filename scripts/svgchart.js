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
    image : document.getElementById("svgimage"),
    
    init : function (ra, dec, _fov_arcmin) {
        
    },
    
    updateStars : function (_stars) {
        
    },
    
    drawStar : function (_elementToDrawTo, _star) {
        // compute the coordinates, in pixels
        // compute the radius
        // create a circle element, and that position, using that radius, filled black.
    },
    
    updateComparisonLabels : function (_stars) {
        
    },
    
    drawLabel : function (_elementToDrawTo, _star) {
        
    }
};
