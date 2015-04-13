// JavaScript Document

var ChartXYToRADec = {
    imageElem : document.getElementById ("chart"),
    centerXYCoordsRatios : [600.0/1200, 765.0/1500],
    centerRADecCoords : [],
    ChartXYToRADec : [],
    focalLength : 0,
    
    init : function (centerRADec, fov_mins) {
        ChartXYToRADec.centerRADecCoords = centerRADec;
        var offset = [ChartXYToRADec.imageElem.x, ChartXYToRADec.imageElem.y];
        ChartXYToRADec.centerXYCoords = [ChartXYToRADec.imageElem.width * ChartXYToRADec.centerXYCoordsRatios[0] + offset[0],
                                         ChartXYToRADec.imageElem.height * ChartXYToRADec.centerXYCoordsRatios[1] + offset[1]];

    /* use a tangent projection:
          ChartXYToRADec.imageElem.width / 2 = R * tan (fov/2) =>
          R =  ChartXYToRADec.imageElem.width / (2 * tan (fov/2))
    */
        ChartXYToRADec.focalLength = ChartXYToRADec.imageElem.width / (2 * Math.tan (fov_mins * Math.PI /(2 * 60.0 * 180)));
    },
    
    getRADec : function (xy) {
        // dRA = atan (x - center.x, focalLength)
        var dra = 180 / Math.PI * atan (xy[0] - ChartXYToRADec.ChartXYToRADec[0], ChartXYToRADec.focalLength);
        // dDec = atan (y - center.y, focalLength)
        var ddec = 180 / Math.PI * atan (xy[1] - ChartXYToRADec.ChartXYToRADec[1], ChartXYToRADec.focalLength);
        
        return [ChartXYToRADec.centerRADecCoords[0] + dra, ChartXYToRADec.centerRADecCoords[1] + ddec];
    }
};
