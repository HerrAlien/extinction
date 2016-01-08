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

var SaveLoadCompnent = {
    frame : null,
    loadButton : null,
    saveButton : null,
    sessionNameInput : null,
    sessionsList : null,
    
    init : function () {
        SaveLoadCompnent.frame = document.getElementById ("saveload");
        SaveLoadCompnent.loadButton = document.getElementById ("LoadSessionButton");
        SaveLoadCompnent.saveButton = document.getElementById ("SaveSessionButton");
        SaveLoadCompnent.sessionNameInput = document.getElementById ("sessionName");
        SaveLoadCompnent.sessionsList = document.getElementById ("sessions");
        
        SaveLoadCompnent.loadButton.onclick = function () {
            SaveLoadCompnent.onLoadClicked();
        }
        
        SaveLoadCompnent.saveButton.onclick = function () {
            SaveLoadCompnent.onSaveClicked();
        }
        
        SaveLoadCompnent.sessionsList.onchange = function () {
            SaveLoadCompnent.onSessionSelected();
        }
        
        SaveLoadCompnent.sessionNameInput.oninput = function () {
            SaveLoadCompnent.onSessionNameChanged();
        }
    },
    
    //! @param purpose [bool] the purpose to display the dialog.
    //! If set to true, will display as save dialg.
    //! If set to false, will display as load dialog.
    displayAsSave : function (asSave) {
        if (asSave) {
            SaveLoadCompnent.loadButton.style.display = "none";
            SaveLoadCompnent.saveButton.style.display = "block";
        } else {
            SaveLoadCompnent.loadButton.style.display = "block";
            SaveLoadCompnent.saveButton.style.display = "none";
        }
        SaveLoadCompnent.sessionNameInput.style.display = SaveLoadCompnent.saveButton.style.display;
    },
    
    onSaveClicked : function () {
    
    },
    
    onLoadClicked : function () {
    
    },
    
    onSessionSelected : function () {
        var index = SaveLoadCompnent.sessionsList.value;
        // set the value of the input - text - 22?
        var select = SaveLoadCompnent.sessionsList;
        var textToSet = select[select.selectedIndex].text.substring (22);
        SaveLoadCompnent.sessionNameInput.value = textToSet;
    },
    
    onSessionNameChanged : function () {
    
    }
};

try {
if (Initialization)
    Initialization.init();
} catch (err) {
}
