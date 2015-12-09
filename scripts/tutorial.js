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

var Tutorial = {
    
    currentChapter : 0,
    captionGrabbed : false,
    
    previousDragPos : [0, 0],
    
    sections : [], // to be filled in with the DIVs
    
    window : document.getElementById("tutorial"),
    
    init : function () {
        var sectionNames = ["tutorial0", "tutorial1", "tutorial2", "tutorial3", "tutorial4", "tutorial5", 
                    "tutorial6", "tutorial7", "tutorial8", "tutorial9", "tutorial10", "tutorial11", "tutorial12"];
        var i = 0;
        for (; i < sectionNames.length; i++) {
            Tutorial.sections.push (document.getElementById(sectionNames[i]));
        }
        
        // associate window open and close
        var launchTutorLink = document.getElementById ("launchtutorial");
        launchTutorLink.onclick = function () {
            Tutorial.window.style.display = "block";
        }
        
        var closeTutorWindow = document.getElementById ("close");
        closeTutorWindow.onclick = function () {
            Tutorial.window.style.display = "none";
        }
        
        // associate the next, previous and close links
        var prevAnchor = document.getElementById ("previous");
        prevAnchor.onclick = function () {
            var toIndex = Math.max (Tutorial.currentChapter - 1, 0);
            Tutorial.changeSection (toIndex);
        }
        
        prevAnchor.onclick();
        
        var nextAnchor = document.getElementById ("next");
        nextAnchor.onclick = function () {
            var toIndex = Math.min (Tutorial.currentChapter + 1, sectionNames.length - 1);
            Tutorial.changeSection (toIndex);
        }
        
        // associate the drag event -> move window
        var caption = document.getElementById ("tutorialcaption");
        caption.onmousedown = function () {
            Tutorial.captionGrabbed = true;
            this.style.cursor = "move";
        }
        
        caption.onmouseup = function () {
            Tutorial.captionGrabbed = false;
            this.style.cursor = "auto";
        }
        
        caption.onmouseout = caption.onmouseup;
        
        caption.onmousemove = function (mouseEvt) {
            if (!Tutorial.captionGrabbed)
                return;
          
            // get the window coordinates
            // move the tutorial window
            Tutorial.window.style.left = (Tutorial.window.offsetLeft + mouseEvt.movementX) + "px";
            Tutorial.window.style.top = (Tutorial.window.offsetTop + mouseEvt.movementY) + "px";
        }
        
    },
    
    changeSection : function (toIndex) {
        Tutorial.sections[Tutorial.currentChapter].style.display = "none";
        Tutorial.sections[toIndex].style.display = "block";
        Tutorial.currentChapter = toIndex;
    }
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
