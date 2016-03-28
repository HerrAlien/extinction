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

var Log = {
	domElem : document.getElementById("debug").getElementsByTagName("pre")[0],
	message : function (text) {
		Log.domElem.textContent = text;
	}
};

var AppVersion = {
    spanElem : document.getElementById("version"),
    version : "N/A",
    
    updateVersionString : function () {
        try {
            var manifest = null; 
            if (chrome && chrome.runtime && chrome.runtime.getManifest) 
                manifest = chrome.runtime.getManifest();
            if (manifest)
                AppVersion.version = manifest.version;
                
            AppVersion.onVersionUpdated();
        } catch (err) {
        }
    },
    
    onVersionUpdated : function () {
        AppVersion.spanElem.textContent = AppVersion.version;    
    }
};

var LocationUI = {
    dateTime : document.getElementById("dateTime"),
    latitude  : document.getElementById("lat"),
    longitude : document.getElementById("long"),
      
      init : function () {
        var lat = LocationUI.latitude;
        var long = LocationUI.longitude;
        LocationUI.dateTime.oninput = CorrectorUIManager.onLocationOrTimeChanged;

        InputValidator.AddNumberRangeValidator (lat, -90, 90);
        InputValidator.AddNumberRangeValidator (long, -180, 180);
        lat.onfocus = function () { InputValidator.validate (this); }
        long.onfocus = function () { InputValidator.validate (this); }
        lat.oninput = function () { this.onfocus(); CorrectorUIManager.onLocationOrTimeChanged(); }
        long.oninput = function () { this.onfocus(); CorrectorUIManager.onLocationOrTimeChanged(); }
        lat.onmouseenter = lat.onfocus;
        long.onmouseenter = long.onfocus;
    }
};

var Initialization = {

    doneInit : false,
    url : false,  
    
    setURL : function (_u) {
        Initialization.url = _u;
        DataShareLoader.load(Initialization.url);
    },
    
    sesionData : {
        Photometry : {
            frame : {"fov":1200,"maglimit":7,"chartID":"X15387AOS"},
            variableStar : {"ra":279.2368333333333,"dec":-28.927722222222222,"mag":"unknown","label":"V","airmass":1.2334784184705363,"name":"Nova Sgr 2015 No. 2"},
            comparisonStars : [{"ra":283.8163333333333,"dec":-26.296583333333334,"mag":2.02,"label":20},{"ra":285.65291666666667,"dec":-29.880111111111113,"mag":2.6,"label":26},{"ra":275.2485,"dec":-29.82811111111111,"mag":2.7,"label":27},{"ra":276.99266666666665,"dec":-25.421694444444444,"mag":2.81,"label":28},{"ra":287.44095833333336,"dec":-21.023527777777776,"mag":2.89,"label":29},{"ra":271.4520416666666,"dec":-30.424111111111113,"mag":2.99,"label":30},{"ra":281.414125,"dec":-26.99077777777778,"mag":3.17,"label":32},{"ra":286.7350416666667,"dec":-27.670416666666668,"mag":3.32,"label":33},{"ra":284.43249999999995,"dec":-21.10666666666667,"mag":3.51,"label":35},{"ra":286.17075,"dec":-21.741500000000002,"mag":3.77,"label":38},{"ra":287.3680833333333,"dec":-37.90447222222222,"mag":4.11,"label":41},{"ra":286.60462500000006,"dec":-37.06344444444444,"mag":4.209,"label":42},{"ra":272.02074999999996,"dec":-28.457083333333333,"mag":4.57,"label":46},{"ra":274.51329166666665,"dec":-27.04263888888889,"mag":4.65,"label":47},{"ra":267.29366666666664,"dec":-31.703194444444442,"mag":4.822,"label":48},{"ra":276.3375833333333,"dec":-20.54163888888889,"mag":4.81,"label":48},{"ra":283.54241666666667,"dec":-22.744833333333336,"mag":4.83,"label":48},{"ra":288.885125,"dec":-25.256694444444445,"mag":4.85,"label":48},{"ra":269.772,"dec":-30.253,"mag":4.99,"label":50},{"ra":272.93054166666667,"dec":-23.70122222222222,"mag":4.98,"label":50},{"ra":283.77975,"dec":-22.671305555555556,"mag":4.99,"label":50},{"ra":289.40866666666665,"dec":-18.952916666666667,"mag":4.96,"label":50},{"ra":291.31866666666673,"dec":-24.508583333333334,"mag":5.03,"label":50},{"ra":284.3353333333333,"dec":-20.656333333333333,"mag":5.08,"label":51},{"ra":282.417125,"dec":-20.324666666666666,"mag":5.24,"label":52},{"ra":270.71291666666673,"dec":-24.28247222222222,"mag":5.34,"label":53},{"ra":278.4907083333334,"dec":-33.016555555555556,"mag":5.28,"label":53},{"ra":273.56625,"dec":-21.713166666666666,"mag":5.44,"label":54},{"ra":273.80379166666665,"dec":-20.728277777777777,"mag":5.38,"label":54},{"ra":281.585875,"dec":-22.392166666666665,"mag":5.37,"label":54},{"ra":291.3735833333334,"dec":-23.962444444444444,"mag":5.43,"label":54},{"ra":272.5242083333334,"dec":-30.728694444444443,"mag":5.53,"label":55},{"ra":268.34774999999996,"dec":-34.89513888888889,"mag":5.6,"label":56},{"ra":276.25595833333335,"dec":-30.75658333333333,"mag":5.6,"label":56},{"ra":289.916625,"dec":-35.42144444444444,"mag":5.59,"label":56},{"ra":290.159,"dec":-22.40261111111111,"mag":5.58,"label":56},{"ra":291.57983333333334,"dec":-21.776694444444445,"mag":5.59,"label":56},{"ra":283.50037499999996,"dec":-21.359833333333334,"mag":5.69,"label":57},{"ra":285.61537500000003,"dec":-24.84638888888889,"mag":5.65,"label":57},{"ra":268.08233333333334,"dec":-34.41683333333333,"mag":5.84,"label":58},{"ra":279.6279583333333,"dec":-23.50488888888889,"mag":5.81,"label":58},{"ra":285.26666666666665,"dec":-37.061388888888885,"mag":5.82,"label":58},{"ra":268.05691666666667,"dec":-34.799194444444446,"mag":5.9,"label":59},{"ra":276.95616666666666,"dec":-29.816861111111113,"mag":5.92,"label":59},{"ra":284.00279166666667,"dec":-23.173750000000002,"mag":5.93,"label":59},{"ra":291.26683333333335,"dec":-29.309361111111112,"mag":5.91,"label":59},{"ra":268.24,"dec":-35.62430555555556,"mag":6.03,"label":60},{"ra":268.613,"dec":-34.466722222222224,"mag":5.96,"label":60},{"ra":270.9685,"dec":-24.360722222222222,"mag":5.97,"label":60},{"ra":273.8040416666667,"dec":-20.38797222222222,"mag":5.95,"label":60},{"ra":286.87850000000003,"dec":-28.636805555555554,"mag":6.04,"label":60},{"ra":268.20508333333333,"dec":-34.11483333333334,"mag":6.06,"label":61},{"ra":284.58866666666665,"dec":-31.035972222222224,"mag":6.12,"label":61},{"ra":284.6034583333333,"dec":-22.5295,"mag":6.14,"label":61},{"ra":268.33158333333336,"dec":-34.730805555555555,"mag":6.17,"label":62},{"ra":268.72516666666667,"dec":-24.887083333333333,"mag":6.2,"label":62},{"ra":274.350375,"dec":-28.652055555555553,"mag":6.19,"label":62},{"ra":275.38070833333336,"dec":-24.915277777777778,"mag":6.25,"label":62},{"ra":275.50058333333334,"dec":-28.429972222222222,"mag":6.16,"label":62},{"ra":280.46504166666665,"dec":-23.83336111111111,"mag":6.23,"label":62},{"ra":285.40725,"dec":-22.69536111111111,"mag":6.24,"label":62},{"ra":286.71858333333336,"dec":-37.81066666666666,"mag":6.16,"label":62},{"ra":271.7972916666667,"dec":-21.443944444444444,"mag":6.28,"label":63},{"ra":276.93220833333334,"dec":-26.634888888888888,"mag":6.31,"label":63},{"ra":277.02570833333334,"dec":-26.75725,"mag":6.27,"label":63},{"ra":287.82841666666667,"dec":-29.502277777777778,"mag":6.3,"label":63},{"ra":290.404625,"dec":-19.234444444444446,"mag":6.26,"label":63},{"ra":272.81162500000005,"dec":-19.84197222222222,"mag":6.34,"label":63},{"ra":268.49220833333334,"dec":-34.83105555555556,"mag":6.42,"label":64},{"ra":274.34895833333337,"dec":-28.288972222222224,"mag":6.4,"label":64},{"ra":278.9985,"dec":-29.69911111111111,"mag":6.37,"label":64},{"ra":281.32775000000004,"dec":-21.00161111111111,"mag":6.36,"label":64},{"ra":285.10325,"dec":-24.94227777777778,"mag":6.36,"label":64},{"ra":268.232375,"dec":-35.01888888888889,"mag":6.45,"label":65},{"ra":272.1607916666666,"dec":-21.449555555555555,"mag":6.486,"label":65},{"ra":272.99233333333336,"dec":-28.901527777777776,"mag":6.51,"label":65},{"ra":274.67400000000004,"dec":-25.604805555555558,"mag":6.51,"label":65},{"ra":290.374,"dec":-34.983444444444444,"mag":6.48,"label":65},{"ra":274.23954166666664,"dec":-27.715888888888887,"mag":6.647,"label":66},{"ra":282.710375,"dec":-22.16219444444444,"mag":6.61,"label":66},{"ra":283.034875,"dec":-21.92152777777778,"mag":6.576,"label":66},{"ra":284.5854166666666,"dec":-24.87686111111111,"mag":6.62,"label":66},{"ra":287.18424999999996,"dec":-18.952777777777776,"mag":6.555,"label":66},{"ra":287.4015,"dec":-36.16480555555555,"mag":6.56,"label":66},{"ra":290.109125,"dec":-31.817611111111113,"mag":6.58,"label":66},{"ra":281.5160833333333,"dec":-27.499000000000002,"mag":6.617,"label":66},{"ra":267.8022916666667,"dec":-30.55686111111111,"mag":6.66,"label":67},{"ra":279.758625,"dec":-23.182083333333335,"mag":6.72,"label":67},{"ra":287.1852083333333,"dec":-23.190277777777776,"mag":6.676,"label":67},{"ra":290.6679166666667,"dec":-20.642916666666665,"mag":6.745,"label":67},{"ra":274.4630416666667,"dec":-18.7985,"mag":6.74,"label":67},{"ra":269.20845833333334,"dec":-32.68886111111111,"mag":6.68,"label":67},{"ra":268.302,"dec":-32.032333333333334,"mag":6.785,"label":68},{"ra":273.40554166666664,"dec":-31.967333333333332,"mag":6.785,"label":68},{"ra":276.67004166666663,"dec":-30.393333333333334,"mag":6.75,"label":68},{"ra":277.829,"dec":-18.908805555555553,"mag":6.804,"label":68},{"ra":279.26366666666667,"dec":-28.513055555555557,"mag":6.782,"label":68},{"ra":268.07112500000005,"dec":-31.32811111111111,"mag":6.941,"label":69},{"ra":268.55991666666665,"dec":-34.72763888888889,"mag":6.867,"label":69},{"ra":268.6995,"dec":-34.54216666666667,"mag":6.944,"label":69},{"ra":271.2939583333333,"dec":-24.398555555555554,"mag":6.867,"label":69},{"ra":275.30170833333335,"dec":-26.08511111111111,"mag":6.898,"label":69},{"ra":277.29970833333334,"dec":-29.259527777777777,"mag":6.888,"label":69},{"ra":278.86075,"dec":-32.89075,"mag":6.857,"label":69},{"ra":283.45254166666666,"dec":-19.79713888888889,"mag":6.944,"label":69},{"ra":286.742875,"dec":-22.497611111111112,"mag":6.879,"label":69},{"ra":288.65175,"dec":-29.831194444444446,"mag":6.878,"label":69},{"ra":289.74608333333333,"dec":-33.278305555555555,"mag":6.941,"label":69},{"ra":273.91741666666667,"dec":-33.09152777777778,"mag":6.933,"label":69},{"ra":266.94812500000006,"dec":-34.31066666666666,"mag":6.938,"label":69},{"ra":267.5880833333333,"dec":-27.061666666666667,"mag":6.956,"label":70},{"ra":272.227125,"dec":-29.992944444444447,"mag":6.995,"label":70},{"ra":274.46275,"dec":-33.39613888888889,"mag":6.999,"label":70},{"ra":275.3185416666667,"dec":-30.941472222222224,"mag":6.985,"label":70},{"ra":277.0295833333333,"dec":-22.99963888888889,"mag":6.966,"label":70},{"ra":289.54558333333335,"dec":-18.863805555555558,"mag":6.972,"label":70}],
        },
        Hipparcos : {
            chart : {"stars":[{"ra":276.04311022,"dec":-34.38431547,"mag":1.81,"label":"7401 3471 1 7401 3471 1 ","airmass":1},{"ra":283.81631813,"dec":-26.29659465,"mag":2.07,"label":"6868 1829 1 6868 1829 1 ","airmass":1},{"ra":285.65295394,"dec":-29.88011266,"mag":2.61,"label":"6885 2837 1 6885 2837 1 ","airmass":1},{"ra":275.24842299,"dec":-29.82803982,"mag":2.7,"label":"6856 2170 1 6856 2170 1 ","airmass":1},{"ra":276.99278975,"dec":-25.42124713,"mag":2.83,"label":"6861 3180 1 6861 3180 1 ","airmass":1},{"ra":287.44097424,"dec":-21.02352563,"mag":2.9,"label":"6295 282 1 6295  282 1 ","airmass":1},{"ra":274.40720514,"dec":-36.76128061,"mag":3.13,"label":"7404 7057 1 7404 7057 1 ","airmass":1},{"ra":281.41397105,"dec":-26.99077995,"mag":3.17,"label":"6867 2428 1 6867 2428 1 ","airmass":1},{"ra":286.73517547,"dec":-27.66981261,"mag":3.32,"label":"6881 1777 1 6881 1777 1 ","airmass":1},{"ra":284.4324148,"dec":-21.10662413,"mag":3.53,"label":"6294 2507 1 6294 2507 1 ","airmass":1},{"ra":271.45218709,"dec":-30.42364838,"mag":3.63,"label":"7391 2710 1 7391 2710 1 ","airmass":1},{"ra":286.17055866,"dec":-21.7413545,"mag":3.77,"label":"6295 2492 1 6295 2492 1 ","airmass":1},{"ra":273.44086985,"dec":-21.05882995,"mag":3.84,"label":"6276 3093 1 6276 3093 1 ","airmass":1},{"ra":287.36782782,"dec":-37.90424015,"mag":4.1,"label":"7917 2653 1 7917 2653 1 ","airmass":1},{"ra":286.60433158,"dec":-37.06275714,"mag":4.23,"label":"7422 1737 1 7422 1737 1 ","airmass":1},{"ra":272.02068038,"dec":-28.45701548,"mag":4.56,"label":"6854 4372 1 6854 4372 1 ","airmass":1},{"ra":271.25509411,"dec":-29.58007695,"mag":4.65,"label":"6854 4373 1 6854 4373 1 ","airmass":1},{"ra":274.51328337,"dec":-27.04263472,"mag":4.65,"label":"6852 5204 1 6852 5204 1 ","airmass":1},{"ra":269.94815357,"dec":-23.81601135,"mag":4.74,"label":"6841 1403 1 6841 1403 1 ","airmass":1},{"ra":284.68114174,"dec":-37.10708804,"mag":4.83,"label":"7421 2296 1 7421 2296 1 ","airmass":1},{"ra":283.54240059,"dec":-22.74482115,"mag":4.85,"label":"6860 863 1 6860  863 1 ","airmass":1},{"ra":281.08066474,"dec":-35.64192104,"mag":4.86,"label":"7419 3077 1 7419 3077 1 ","airmass":1},{"ra":276.3376289,"dec":-20.54161851,"mag":4.86,"label":"6274 1663 1 6274 1663 1 ","airmass":1},{"ra":288.88498968,"dec":-25.25660913,"mag":4.87,"label":"6879 2498 1 6879 2498 1 ","airmass":1},{"ra":272.93053141,"dec":-23.70116721,"mag":4.96,"label":"6843 1347 1 6843 1347 1 ","airmass":1},{"ra":283.77946577,"dec":-22.67125265,"mag":5,"label":"6860 304 1 6860  304 1 ","airmass":1},{"ra":284.33532332,"dec":-20.65633511,"mag":5.06,"label":"6294 1245 1 6294 1245 1 ","airmass":1},{"ra":275.57751781,"dec":-38.65682561,"mag":5.07,"label":"7901 3102 1 7901 3102 1 ","airmass":1},{"ra":280.94558802,"dec":-38.32331082,"mag":5.12,"label":"7915 1673 1 7915 1673 1 ","airmass":1},{"ra":269.7720051,"dec":-30.25301412,"mag":5.16,"label":"7378 3132 1 7378 3132 1 ","airmass":1},{"ra":282.41711327,"dec":-20.32474,"mag":5.22,"label":"6289 3134 1 6289 3134 1 ","airmass":1},{"ra":278.49068662,"dec":-33.01653284,"mag":5.28,"label":"7398 1312 1 7398 1312 1 ","airmass":1},{"ra":275.72115794,"dec":-36.66949245,"mag":5.35,"label":"7405 3486 1 7405 3486 1 ","airmass":1},{"ra":273.80377361,"dec":-20.72826652,"mag":5.35,"label":"6276 1023 1 6276 1023 1 ","airmass":1},{"ra":284.1687101,"dec":-37.34318385,"mag":5.36,"label":"7421 2297 1 7421 2297 1 ","airmass":1},{"ra":281.5857835,"dec":-22.39218519,"mag":5.38,"label":"6292 924 1 6292  924 1 ","airmass":1},{"ra":277.77019084,"dec":-32.98900127,"mag":5.39,"label":"7398 1220 1 7398 1220 1 ","airmass":1},{"ra":270.71292618,"dec":-24.28242817,"mag":5.39,"label":"6842 1740 1 6842 1740 1 ","airmass":1},{"ra":273.56629342,"dec":-21.71310693,"mag":5.48,"label":"6276 3094 1 6276 3094 1 ","airmass":1},{"ra":278.47286535,"dec":-24.03226726,"mag":5.5,"label":"6858 1412 1 6858 1412 1 ","airmass":1},{"ra":286.10439646,"dec":-31.04703191,"mag":5.5,"label":"7410 3044 1 7410 3044 1 ","airmass":1},{"ra":275.87008768,"dec":-36.23799992,"mag":5.52,"label":"7405 2981 1 7405 2981 1 ","airmass":1},{"ra":276.25630291,"dec":-30.75640163,"mag":5.58,"label":"7393 1807 1 7393 1807 1 ","airmass":1},{"ra":287.06958016,"dec":-19.29028544,"mag":5.58,"label":"6291 1685 1 6291 1685 1 ","airmass":1},{"ra":278.34638781,"dec":-38.72593295,"mag":5.61,"label":"7902 891 1 7902  891 1 ","airmass":1},{"ra":272.52419138,"dec":-30.72860072,"mag":5.62,"label":"7392 3056 1 7392 3056 1 ","airmass":1},{"ra":285.6153785,"dec":-24.84639514,"mag":5.63,"label":"6877 981 1 6877  981 1 ","airmass":1},{"ra":283.50037681,"dec":-21.35979584,"mag":5.68,"label":"6293 2525 1 6293 2525 1 ","airmass":1},{"ra":285.82369482,"dec":-38.253182,"mag":5.72,"label":"7917 638 1 7917  638 1 ","airmass":1},{"ra":269.7319964,"dec":-36.85840739,"mag":5.74,"label":"7390 693 1 7390  693 1 ","airmass":1},{"ra":270.47658749,"dec":-22.78028972,"mag":5.76,"label":"6842 111 1 6842  111 1 ","airmass":1},{"ra":288.30695913,"dec":-25.9067642,"mag":5.77,"label":"6878 943 1 6878  943 1 ","airmass":1},{"ra":279.62797977,"dec":-23.50484565,"mag":5.78,"label":"6858 1156 1 6858 1156 1 ","airmass":1},{"ra":281.20667874,"dec":-25.01086372,"mag":5.82,"label":"6863 330 1 6863  330 1 ","airmass":1},{"ra":279.72269785,"dec":-21.0515022,"mag":5.86,"label":"6279 1723 1 6279 1723 1 ","airmass":1},{"ra":276.95618315,"dec":-29.81690186,"mag":5.91,"label":"6869 1277 1 6869 1277 1 ","airmass":1},{"ra":284.00280399,"dec":-23.17371805,"mag":5.93,"label":"6860 1192 1 6860 1192 1 ","airmass":1},{"ra":271.59851181,"dec":-36.01980885,"mag":5.94,"label":"7403 6261 1 7403 6261 1 ","airmass":1},{"ra":279.47678203,"dec":-21.39756491,"mag":5.94,"label":"6279 1724 1 6279 1724 1 ","airmass":1},{"ra":270.9685186,"dec":-24.36072608,"mag":5.94,"label":"6842 1702 1 6842 1702 1 ","airmass":1},{"ra":271.20995679,"dec":-35.9013635,"mag":5.97,"label":"7403 6940 1 7403 6940 1 ","airmass":1},{"ra":269.66270923,"dec":-28.75907592,"mag":5.97,"label":"6853 4503 1 6853 4503 1 ","airmass":1},{"ra":273.80403892,"dec":-20.38796901,"mag":5.98,"label":"6272 89 1 6272  89 1 ","airmass":1},{"ra":285.76584668,"dec":-19.24565853,"mag":6.01,"label":"6290 2062 1 6290 2062 1 ","airmass":1},{"ra":286.87850341,"dec":-28.63678208,"mag":6.03,"label":"6886 1547 1 6886 1547 1 ","airmass":1},{"ra":274.401038,"dec":-34.10723545,"mag":6.04,"label":"7400 1084 1 7400 1084 1 ","airmass":1},{"ra":284.58879957,"dec":-31.03585666,"mag":6.09,"label":"7409 2114 1 7409 2114 1 ","airmass":1},{"ra":283.15435492,"dec":-29.3795634,"mag":6.1,"label":"6872 1003 1 6872 1003 1 ","airmass":1},{"ra":287.45055263,"dec":-19.80345566,"mag":6.12,"label":"6291 1794 1 6291 1794 1 ","airmass":1},{"ra":272.73060936,"dec":-33.80006841,"mag":6.14,"label":"7400 114 1 7400  114 1 ","airmass":1},{"ra":286.71918142,"dec":-37.80976612,"mag":6.15,"label":"7917 565 1 7917  565 1 ","airmass":1},{"ra":284.6034528,"dec":-22.52952577,"mag":6.15,"label":"6860 432 1 6860  432 1 ","airmass":1},{"ra":276.34040816,"dec":-35.99203103,"mag":6.15,"label":"7405 2262 1 7405 2262 1 ","airmass":1},{"ra":275.50055548,"dec":-28.42995213,"mag":6.16,"label":"6856 1365 1 6856 1365 1 ","airmass":1},{"ra":274.35033,"dec":-28.65202872,"mag":6.18,"label":"6856 71 1 6856  71 1 ","airmass":1},{"ra":280.46504377,"dec":-23.83335427,"mag":6.21,"label":"6858 2986 1 6858 2986 1 ","airmass":1},{"ra":270.00033636,"dec":-20.33949258,"mag":6.23,"label":"6259 36 1 6259  36 1 ","airmass":1},{"ra":285.40724152,"dec":-22.69536609,"mag":6.23,"label":"6873 524 1 6873  524 1 ","airmass":1},{"ra":288.88814395,"dec":-24.17910603,"mag":6.25,"label":"6875 3273 1 6875 3273 1 ","airmass":1},{"ra":275.38068279,"dec":-24.91527088,"mag":6.25,"label":"6848 4472 1 6848 4472 1 ","airmass":1},{"ra":271.7973046,"dec":-21.44393279,"mag":6.27,"label":"6263 2328 1 6263 2328 1 ","airmass":1},{"ra":278.34616611,"dec":-38.7200035,"mag":6.28,"label":"7902 1905 1 7902 1905 1 ","airmass":1},{"ra":287.82835457,"dec":-29.50224107,"mag":6.28,"label":"6886 2564 1 6886 2564 1 ","airmass":1},{"ra":277.02571352,"dec":-26.75716263,"mag":6.28,"label":"6865 2122 1 6865 2122 1 ","airmass":1},{"ra":282.71042129,"dec":-22.16210417,"mag":6.29,"label":"6293 236 1 6293  236 1 ","airmass":1},{"ra":287.06066229,"dec":-24.65734778,"mag":6.29,"label":"6878 781 1 6878  781 1 ","airmass":1},{"ra":283.11798577,"dec":-26.65062323,"mag":6.3,"label":"6868 429 1 6868  429 1 ","airmass":1},{"ra":281.03304857,"dec":-36.71823477,"mag":6.31,"label":"7419 33 1 7419  33 1 ","airmass":1},{"ra":270.45126437,"dec":-36.37780302,"mag":6.31,"label":"7403 6450 1 7403 6450 1 ","airmass":1},{"ra":276.47752587,"dec":-33.94569171,"mag":6.32,"label":"7401 114 1 7401  114 1 ","airmass":1},{"ra":281.32767193,"dec":-21.00154583,"mag":6.34,"label":"6292 160 1 6292  160 1 ","airmass":1},{"ra":276.93221263,"dec":-26.63480687,"mag":6.35,"label":"6865 3099 1 6865 3099 1 ","airmass":1},{"ra":278.9985062,"dec":-29.69907892,"mag":6.36,"label":"6870 131 1 6870  131 1 ","airmass":1},{"ra":285.7791236,"dec":-19.10301574,"mag":6.36,"label":"6290 1216 1 6290 1216 1 ","airmass":1},{"ra":285.10324341,"dec":-24.9422704,"mag":6.36,"label":"6877 263 1 6877  263 1 ","airmass":1},{"ra":274.34860207,"dec":-28.28860528,"mag":6.36,"label":"6856 81 1 6856  81 1 ","airmass":1},{"ra":270.71850118,"dec":-24.28703372,"mag":6.38,"label":"6842 1291 1 6842 1291 1 ","airmass":1},{"ra":288.11674591,"dec":-21.65832758,"mag":6.39,"label":"6308 2022 1 6308 2022 1 ","airmass":1},{"ra":272.49984164,"dec":-32.71926865,"mag":6.41,"label":"7396 1619 1 7396 1619 1 ","airmass":1},{"ra":285.26792158,"dec":-37.06150549,"mag":6.41,"label":"7421 2295 1 7421 2295 1 ","airmass":1},{"ra":275.2299528,"dec":-37.48763058,"mag":6.43,"label":"7405 2063 1 7405 2063 1 ","airmass":1},{"ra":281.50479732,"dec":-19.60636966,"mag":6.43,"label":"6288 1145 1 6288 1145 1 ","airmass":1},{"ra":280.72961099,"dec":-19.28412802,"mag":6.43,"label":"6288 1933 1 6288 1933 1 ","airmass":1},{"ra":284.1134492,"dec":-31.68900542,"mag":6.45,"label":"7409 2076 1 7409 2076 1 ","airmass":1},{"ra":283.84813804,"dec":-37.38660124,"mag":6.48,"label":"7421 2145 1 7421 2145 1 ","airmass":1},{"ra":278.83880347,"dec":-20.84043894,"mag":6.48,"label":"6279 1453 1 6279 1453 1 ","airmass":1},{"ra":272.16077877,"dec":-21.44955427,"mag":6.5,"label":"6276 1797 1 6276 1797 1 ","airmass":1},{"ra":272.8116195,"dec":-19.84200882,"mag":6.5,"label":"6272 2382 1 6272 2382 1 ","airmass":1},{"ra":274.67400355,"dec":-25.60471809,"mag":6.5,"label":"6848 4446 1 6848 4446 1 ","airmass":1},{"ra":272.99229371,"dec":-28.90151807,"mag":6.53,"label":"6855 3412 1 6855 3412 1 ","airmass":1},{"ra":287.61492875,"dec":-30.00695999,"mag":6.53,"label":"7410 3048 1 7410 3048 1 ","airmass":1},{"ra":287.4015389,"dec":-36.16477829,"mag":6.54,"label":"7422 1734 1 7422 1734 1 ","airmass":1},{"ra":278.63650454,"dec":-24.22239004,"mag":6.55,"label":"6858 1512 1 6858 1512 1 ","airmass":1},{"ra":287.18419248,"dec":-18.95279059,"mag":6.56,"label":"6291 976 1 6291  976 1 ","airmass":1},{"ra":281.32803803,"dec":-35.85663025,"mag":6.57,"label":"7420 989 1 7420  989 1 ","airmass":1},{"ra":272.34375685,"dec":-36.6725189,"mag":6.57,"label":"7404 5491 1 7404 5491 1 ","airmass":1},{"ra":288.04073776,"dec":-37.58308952,"mag":6.57,"label":"7918 1457 1 7918 1457 1 ","airmass":1},{"ra":283.03477949,"dec":-21.92141115,"mag":6.58,"label":"6293 2060 1 6293 2060 1 ","airmass":1},{"ra":277.97223619,"dec":-19.12505717,"mag":6.59,"label":"6274 1601 1 6274 1601 1 ","airmass":1},{"ra":284.84925097,"dec":-19.27928936,"mag":6.59,"label":"6290 2149 1 6290 2149 1 ","airmass":1},{"ra":282.32142337,"dec":-34.74889317,"mag":6.59,"label":"7416 1615 1 7416 1615 1 ","airmass":1},{"ra":269.28108092,"dec":-23.93923919,"mag":6.6,"label":"6841 1672 1 6841 1672 1 ","airmass":1},{"ra":281.51600566,"dec":-27.49906274,"mag":6.61,"label":"6867 640 1 6867  640 1 ","airmass":1},{"ra":277.31995678,"dec":-38.85126621,"mag":6.63,"label":"7901 1076 1 7901 1076 1 ","airmass":1},{"ra":284.58541651,"dec":-24.87685133,"mag":6.63,"label":"6864 53 1 6864  53 1 ","airmass":1},{"ra":270.04803877,"dec":-24.28418542,"mag":6.65,"label":"6842 1845 1 6842 1845 1 ","airmass":1},{"ra":283.17369926,"dec":-30.73401797,"mag":6.65,"label":"7408 1059 1 7408 1059 1 ","airmass":1},{"ra":277.34161062,"dec":-25.25658821,"mag":6.65,"label":"6861 2842 1 6861 2842 1 ","airmass":1},{"ra":279.82448416,"dec":-34.16628147,"mag":6.66,"label":"7415 4011 1 7415 4011 1 ","airmass":1},{"ra":272.77175385,"dec":-25.76233627,"mag":6.67,"label":"6847 3049 1 6847 3049 1 ","airmass":1},{"ra":279.97366027,"dec":-20.07120215,"mag":6.67,"label":"6275 337 1 6275  337 1 ","airmass":1},{"ra":277.23899138,"dec":-26.58205725,"mag":6.67,"label":"6865 1785 1 6865 1785 1 ","airmass":1},{"ra":287.1852094,"dec":-23.19025126,"mag":6.67,"label":"6874 1281 1 6874 1281 1 ","airmass":1},{"ra":270.72623613,"dec":-27.82666475,"mag":6.68,"label":"6850 3106 1 6850 3106 1 ","airmass":1},{"ra":274.3239243,"dec":-38.1776987,"mag":6.69,"label":"7900 1791 1 7900 1791 1 ","airmass":1},{"ra":282.26292758,"dec":-32.7104286,"mag":6.69,"label":"7412 1073 1 7412 1073 1 ","airmass":1},{"ra":285.26354656,"dec":-37.06085073,"mag":6.7,"label":"7421 2294 1 7421 2294 1 ","airmass":1},{"ra":272.22518673,"dec":-25.47303619,"mag":6.72,"label":"6847 3001 1 6847 3001 1 ","airmass":1},{"ra":279.75862779,"dec":-23.1820822,"mag":6.72,"label":"6858 1190 1 6858 1190 1 ","airmass":1},{"ra":270.75712863,"dec":-22.71848535,"mag":6.73,"label":"6842 899 1 6842  899 1 ","airmass":1},{"ra":283.85799311,"dec":-29.21310305,"mag":6.75,"label":"6872 737 1 6872  737 1 ","airmass":1},{"ra":281.03655919,"dec":-19.31788317,"mag":6.75,"label":"6288 538 1 6288  538 1 ","airmass":1},{"ra":276.67000896,"dec":-30.39318212,"mag":6.75,"label":"7393 1359 1 7393 1359 1 ","airmass":1},{"ra":282.39732671,"dec":-19.14233878,"mag":6.76,"label":"6289 1671 1 6289 1671 1 ","airmass":1},{"ra":270.65549814,"dec":-20.7376152,"mag":6.79,"label":"6263 2986 1 6263 2986 1 ","airmass":1},{"ra":279.26366794,"dec":-28.51273284,"mag":6.79,"label":"6870 160 1 6870  160 1 ","airmass":1},{"ra":283.42064545,"dec":-31.99196329,"mag":6.79,"label":"7412 1577 1 7412 1577 1 ","airmass":1},{"ra":269.79398788,"dec":-38.57342048,"mag":6.8,"label":"7886 2534 1 7886 2534 1 ","airmass":1},{"ra":273.40556349,"dec":-31.96731614,"mag":6.8,"label":"7396 136 1 7396  136 1 ","airmass":1},{"ra":269.48645117,"dec":-36.00790978,"mag":6.83,"label":"7390 2674 1 7390 2674 1 ","airmass":1},{"ra":269.77371344,"dec":-30.25340301,"mag":6.83,"label":"7378 3133 1 7378 3133 1 ","airmass":1},{"ra":278.31002825,"dec":-24.10951954,"mag":6.83,"label":"6857 628 1 6857  628 1 ","airmass":1},{"ra":271.29395339,"dec":-24.39856262,"mag":6.84,"label":"6846 1128 1 6846 1128 1 ","airmass":1},{"ra":287.43247306,"dec":-27.11434963,"mag":6.85,"label":"6882 299 1 6882  299 1 ","airmass":1},{"ra":271.38720268,"dec":-37.47176453,"mag":6.86,"label":"7403 2021 1 7403 2021 1 ","airmass":1},{"ra":287.19528601,"dec":-25.07932445,"mag":6.86,"label":"6878 507 1 6878  507 1 ","airmass":1},{"ra":279.67447398,"dec":-30.02789517,"mag":6.86,"label":"7407 396 1 7407  396 1 ","airmass":1},{"ra":286.05916185,"dec":-22.8965057,"mag":6.87,"label":"6873 342 1 6873  342 1 ","airmass":1},{"ra":278.84869794,"dec":-19.2685076,"mag":6.87,"label":"6275 252 1 6275  252 1 ","airmass":1},{"ra":275.07008254,"dec":-35.42867975,"mag":6.87,"label":"7401 509 1 7401  509 1 ","airmass":1},{"ra":278.86071412,"dec":-32.89076744,"mag":6.87,"label":"7398 339 1 7398  339 1 ","airmass":1},{"ra":286.74288051,"dec":-22.49759261,"mag":6.88,"label":"6295 378 1 6295  378 1 ","airmass":1},{"ra":282.05582326,"dec":-19.1988895,"mag":6.88,"label":"6289 1961 1 6289 1961 1 ","airmass":1},{"ra":288.6516896,"dec":-29.83119859,"mag":6.88,"label":"6886 1228 1 6886 1228 1 ","airmass":1},{"ra":277.2996965,"dec":-29.25941885,"mag":6.89,"label":"6869 216 1 6869  216 1 ","airmass":1},{"ra":281.69694683,"dec":-29.63155733,"mag":6.9,"label":"6871 649 1 6871  649 1 ","airmass":1},{"ra":274.14736216,"dec":-20.5444658,"mag":6.91,"label":"6273 1426 1 6273 1426 1 ","airmass":1},{"ra":270.38260203,"dec":-38.0822085,"mag":6.91,"label":"7899 8435 1 7899 8435 1 ","airmass":1},{"ra":278.93149279,"dec":-29.93752239,"mag":6.92,"label":"6870 999 1 6870  999 1 ","airmass":1},{"ra":273.96210074,"dec":-36.57375622,"mag":6.92,"label":"7404 5201 1 7404 5201 1 ","airmass":1},{"ra":275.30169144,"dec":-26.08512478,"mag":6.92,"label":"6848 517 1 6848  517 1 ","airmass":1},{"ra":273.86383431,"dec":-34.59450167,"mag":6.92,"label":"7400 33 1 7400  33 1 ","airmass":1},{"ra":282.74946756,"dec":-20.29521712,"mag":6.92,"label":"6289 3062 1 6289 3062 1 ","airmass":1},{"ra":282.09054544,"dec":-37.01346536,"mag":6.93,"label":"7420 449 1 7420  449 1 ","airmass":1},{"ra":274.62696315,"dec":-34.68610255,"mag":6.93,"label":"7401 16 1 7401  16 1 ","airmass":1},{"ra":288.28366821,"dec":-38.68100669,"mag":6.93,"label":"7918 636 1 7918  636 1 ","airmass":1},{"ra":284.54484563,"dec":-20.42374862,"mag":6.94,"label":"6290 2342 1 6290 2342 1 ","airmass":1},{"ra":273.9174336,"dec":-33.0915275,"mag":6.94,"label":"7396 207 1 7396  207 1 ","airmass":1},{"ra":283.45252803,"dec":-19.79708876,"mag":6.94,"label":"6289 2467 1 6289 2467 1 ","airmass":1},{"ra":282.06151248,"dec":-33.90814574,"mag":6.95,"label":"7416 827 1 7416  827 1 ","airmass":1},{"ra":281.96804471,"dec":-20.27450143,"mag":6.95,"label":"6288 1258 1 6288 1258 1 ","airmass":1},{"ra":278.13864118,"dec":-35.34957712,"mag":6.95,"label":"7402 2372 1 7402 2372 1 ","airmass":1},{"ra":288.89752404,"dec":-36.94930529,"mag":6.96,"label":"7435 1355 1 7435 1355 1 ","airmass":1},{"ra":277.02955645,"dec":-22.99968237,"mag":6.97,"label":"6857 1094 1 6857 1094 1 ","airmass":1},{"ra":276.01635084,"dec":-34.33405745,"mag":6.97,"label":"7401 2423 1 7401 2423 1 ","airmass":1},{"ra":277.62150046,"dec":-23.25063595,"mag":6.97,"label":"6857 1414 1 6857 1414 1 ","airmass":1},{"ra":277.79777228,"dec":-36.80923055,"mag":6.98,"label":"7406 1721 1 7406 1721 1 ","airmass":1},{"ra":278.12153697,"dec":-18.97263805,"mag":6.98,"label":"6275 946 1 6275  946 1 ","airmass":1},{"ra":288.53652626,"dec":-22.06060481,"mag":6.99,"label":"6308 2295 1 6308 2295 1 ","airmass":1}],"config":{"ra":279.2368333333333,"dec":-28.927722222222222,"fov":1200,"mag":7}}
        },
    },

    initFromSessionData : function() {
        var Photometry = Initialization.sesionData.Photometry;
        PhotmetryTable.frame = Photometry.frame;
        PhotmetryTable.variableStar = Photometry.variableStar;
        PhotmetryTable.comparisonStars = Photometry.comparisonStars;
        Hipparcos.chart = Initialization.sesionData.Hipparcos.chart;
        
        var starNameInput = ChartController.ui.variableStarElem;
        starNameInput.value = PhotmetryTable.frame.chartID;
        starNameInput.oninput();
        
        SVGChart.init (PhotmetryTable.variableStar.ra, PhotmetryTable.variableStar.dec, PhotmetryTable.frame.fov, PhotmetryTable.frame.maglimit);
        SVGChart.drawBorder ();
        Hipparcos.onInit();
        EstimationCorrector.init();
        CorrectorUIManager.onLocationOrTimeChanged();
    },
    
  init: function () {
      try {
      if (!ChartController || !StarsSelection || !CorrectorUIManager || !SVGChart || 
          !PhotmetryTable || !InputValidator || !Hipparcos || !DataShareLoader || 
          !DataShareSave || Initialization.doneInit)
        return;
      } catch (err) {
        return;
    }
      
    ChartController.init();
    StarsSelection.init();
    CorrectorUIManager.init();
    DataShareSave.init();

    PhotmetryTable.onInit = function () {
    	setTimeout (function() {
            var coords = [PhotmetryTable.variableStar.ra, PhotmetryTable.variableStar.dec];
            var frame = PhotmetryTable.frame;   
            EstimationCorrector.init();
            Log.message ("Loading stars from Tycho catalogue ...");
            setTimeout (function() {
                    Hipparcos.init(coords[0], coords[1], frame.fov, frame.maglimit);
                    SVGChart.init (coords[0], coords[1], frame.fov, frame.maglimit);
                    SVGChart.drawBorder ();
                    CorrectorUIManager.onLocationOrTimeChanged();
                }, 100);
        }, 100);
    }

    var extinctionCoeffInput = document.getElementById("K");
    InputValidator.AddNumberMinimumValidator (extinctionCoeffInput, 0);

    extinctionCoeffInput.onfocus =  function () { InputValidator.validate (this); }
    extinctionCoeffInput.onmouseenter =  extinctionCoeffInput.onfocus;
    extinctionCoeffInput.oninput = function () { this.onfocus(); CorrectorUIManager.onLocationOrTimeChanged(); }

    document.documentElement.onscroll = InputValidator.UpdateErrorLabelPosition;
    window.onresize = InputValidator.UpdateErrorLabelPosition;

    Hipparcos.onInit = function () {
    	Log.message ("Done!");
        SVGChart.updateStars (Hipparcos.chart.stars);   	
    	SVGChart.drawCenterMark();
    	SVGChart.updateComparisonLabels (PhotmetryTable.comparisonStars);
    	setTimeout(function() { Log.message (PhotmetryTable.variableStar.name + ", lim. mag.=" + PhotmetryTable.frame.maglimit + ", FOV[']=" + PhotmetryTable.frame.fov + "; chart id=" + PhotmetryTable.frame.chartID);}, 1000);
    }
    
    document.body.onclick = function (){
        if (StarsSelection.selectionJustActivated) 
            StarsSelection.selectionJustActivated = false;
        else
            StarsSelection.setSelectedStar (null);
    }
    
    document.body.onmouseover = function () {
        InputValidator.hideError();
    }
        
    AppVersion.updateVersionString();
    LocationUI.init();
    Initialization.initFromSessionData();
    Initialization.doneInit = true;
    DataShareLoader.load(Initialization.url);
  }
};

Initialization.init();
