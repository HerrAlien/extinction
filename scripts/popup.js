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

function PopupWindow (windowID, captionID) {
    
    var captionGrabbed = false;
    this._window = document.getElementById(windowID);
    var caption = document.getElementById(captionID);
    
    var me = this;
    var previousEvt = null;
    
    caption.onmousedown = function () {
        captionGrabbed = true;
        caption.style.cursor = "move";
    }
    
    caption.onmouseup = function () {
        captionGrabbed = false;
        caption.style.cursor = "pointer";
        previousEvt = null;
    }
    
    caption.onmouseout = caption.onmouseup;
        
    caption.onmousemove = function (mouseEvt) {
        if (!captionGrabbed)
            return;
            
        if (null != previousEvt) {
            // use only API available on all browsers
            me._window.style.left = (me._window.offsetLeft + mouseEvt.pageX - previousEvt.pageX) + "px";
            me._window.style.top = (me._window.offsetTop + mouseEvt.pageY - previousEvt.pageY) + "px";
        }
            
        previousEvt = mouseEvt;
    }
}
