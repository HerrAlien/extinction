// JavaScript Document

var ChartXYToRADec = {
    imageElem : document.getElementById ("chart"),
    centerXYCoordsRatios : [600.0/1200, 765.0/1500],
    usefullWidthRatio : (600 - 18) / 600.0,
    centerRADecCoords : [],
    centerXYCoords : [],
    focalLength : 0,
    
    onCoordsChanged : null,
    
    getRADec : function (xy) {
        var dx = (xy[0] - ChartXYToRADec.centerXYCoords[0]) / ChartXYToRADec.focalLength;
        var dy = (ChartXYToRADec.centerXYCoords[1] - xy[1]) / ChartXYToRADec.focalLength;
        
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
    },

    init : function (centerRADec, fov_mins) {
        ChartXYToRADec.centerRADecCoords = centerRADec;
        var offset = [ChartXYToRADec.imageElem.x || ChartXYToRADec.imageElem.offsetLeft, 
                      ChartXYToRADec.imageElem.y || ChartXYToRADec.imageElem.offsetTop];
        ChartXYToRADec.centerXYCoords = [ChartXYToRADec.imageElem.width * ChartXYToRADec.centerXYCoordsRatios[0] + offset[0],
                                         ChartXYToRADec.imageElem.height * ChartXYToRADec.centerXYCoordsRatios[1] + offset[1]];

    /* use a tangent projection:
          ChartXYToRADec.imageElem.width / 2 = R * tan (fov/2) =>
          R =  ChartXYToRADec.imageElem.width / (2 * tan (fov/2))
    */
        ChartXYToRADec.focalLength = (0.5 * ChartXYToRADec.imageElem.width * ChartXYToRADec. usefullWidthRatio) / ( Math.tan(((0.5 * fov_mins)/60) * Math.PI / 180 ));
        ChartXYToRADec.imageElem.onmousemove = function (e) { ChartXYToRADec.handleMouseMovement(e); }
    }
};
