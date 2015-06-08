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

var ChartXYToRADec = {
    imageElem : document.getElementById ("chart"),
    centerXYCoordsRatios : [600.0/1200, 765.0/1500],
    usefullWidthRatio : (600 - 18) / 600.0,
    centerRADecCoords : [],
    centerXYCoords : [],
    focalLength : 0,
    chartOrientation : 0,
    onCoordsChanged : null,
    onMouseMove : null,
    fov_mins : 0,
    
    getRADec : function (xy) {
        // so that we don't need to re-init in case of window resize
        var fov_mins = ChartXYToRADec.fov_mins;
        var offset = [ChartXYToRADec.imageElem.x || ChartXYToRADec.imageElem.offsetLeft, 
                      ChartXYToRADec.imageElem.y || ChartXYToRADec.imageElem.offsetTop];
        ChartXYToRADec.centerXYCoords = [ChartXYToRADec.imageElem.width * ChartXYToRADec.centerXYCoordsRatios[0] + offset[0],
                                         ChartXYToRADec.imageElem.height * ChartXYToRADec.centerXYCoordsRatios[1] + offset[1]];
        ChartXYToRADec.focalLength = (0.5 * ChartXYToRADec.imageElem.width * ChartXYToRADec. usefullWidthRatio) / 
                                     (Math.tan(((0.5 * fov_mins)/60) * Math.PI / 180));

        var dx = (xy[0] - ChartXYToRADec.centerXYCoords[0]) / ChartXYToRADec.focalLength;
        var dy = (ChartXYToRADec.centerXYCoords[1] - xy[1]) / ChartXYToRADec.focalLength;
        
        if (ChartXYToRADec.chartOrientation != 0)
            dx *= -1;
    
        if (ChartXYToRADec.chartOrientation == 1)
            dy *= -1;
        
        var secondOrderK = -0.1;
        
        var dra = 180 / Math.PI * Math.atan (dx  + secondOrderK * dx * dx);
        var ddec = 180 / Math.PI * Math.atan (dy + secondOrderK * dy * dy);
        
        return [ChartXYToRADec.centerRADecCoords[0] - dra, ChartXYToRADec.centerRADecCoords[1] + ddec];
    },
    
    handleMouseMovement : function (evt) {
        var event = evt|| window.event; // IE-ism
        // (This is to support old IE)
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = event.clientX +
              (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
              (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
              (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
              (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }
        
        if (ChartXYToRADec.onCoordsChanged)
            ChartXYToRADec.onCoordsChanged (ChartXYToRADec.getRADec([event.pageX, event.pageY]));
        
        if (ChartXYToRADec.onMouseMove)
            ChartXYToRADec.onMouseMove (event.pageX, event.pageY);
    },

    init : function (centerRADec, fov_mins) {
        ChartXYToRADec.centerRADecCoords = centerRADec;
        ChartXYToRADec.fov_mins = fov_mins;
//        ChartXYToRADec.imageElem.onmousemove = function (e) { ChartXYToRADec.handleMouseMovement(e); }
    }
};
