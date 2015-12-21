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

    sections : [], // to be filled in with the DIVs
    popup : null, 
    window : null, 
    
    init : function () {
        
        Tutorial.popup = new PopupWindow ("tutorial", "tutorialcaption");
        Tutorial.window = Tutorial.popup._window;
        
        var sectionNames = ["tutorial0", "tutorial1", "tutorial2", "tutorial3", "tutorial4", "tutorial5", 
                    "tutorial6", "tutorial7", "tutorial7as", "tutorial7s", "tutorial7b", "tutorial8", "tutorial9", "tutorial10", "tutorial11", "tutorial12"];
        var i = 0;
        for (; i < sectionNames.length; i++) {
            Tutorial.sections.push (document.getElementById(sectionNames[i]));
        }
        
        // associate window open and close
        var launchTutorLink = document.getElementById ("launchtutorial");
        launchTutorLink.onclick = function () {
            Tutorial.window.style.display = "block";
            Tutorial.window.style.top = "200px";
            Tutorial.window.style.left = "200px";
			Tutorial.changeSection (0);
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
        
        var nextAnchor = document.getElementById ("next");
        nextAnchor.onclick = function () {
            var toIndex = Math.min (Tutorial.currentChapter + 1, sectionNames.length - 1);
            Tutorial.changeSection (toIndex);
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
