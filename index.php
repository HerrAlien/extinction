<?php 
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

use google\appengine\api\users\User;
use google\appengine\api\users\UserService;

// display below only if the user agent indicates a mobile device
$allowAccess = false;
$requireGoogleAccount = false;
$userAgent = $_SERVER['HTTP_USER_AGENT'];

$allowAccess = stripos ($userAgent, 'kindle') ||
            stripos ($userAgent, 'android') ||
            stripos ($userAgent, 'BlackBerry') ||
            stripos ($userAgent, 'windows phone') ||
            stripos ($userAgent, 'arm') ||
            stripos ($userAgent, 'opera mini') ||
            stripos ($userAgent, 'opera mobi') ||
            (stripos ($userAgent, 'Macintosh') &&  (stripos($userAgent, 'CriOS') == 0)) ||
            (stripos ($userAgent, 'Mac OS') &&  (stripos($userAgent, 'CriOS') == 0)) ||
            stripos ($userAgent, 'iPad');

if (!$allowAccess) {
  session_start();
  
  $currentTime = time();
  $timeout = 24 * 60 * 60;
  
  if (!isset($_SESSION['CREATED'])) {
    $_SESSION['CREATED'] = $currentTime;
  } else if ($currentTime - $_SESSION['CREATED'] > $timeout) {
    // clean up the counters
    session_regenerate_id(true);    // change session ID for the current session and invalidate old session ID
    session_unset();
    $_SESSION['CREATED'] = $currentTime;  // update creation time
  }
  
  // Win/Lin desktop based browsers may access it, but only for a limitted number of times.
  if (isset ($_SESSION['accessCount']))
  { 
    if ($_SESSION['accessCount'] < 16) {
      $allowAccess = true;
      $_SESSION['accessCount'] = $_SESSION['accessCount'] + 1;
    }
  } else {
      $allowAccess = true;
      $_SESSION['accessCount'] = 1;
  }
}

if ($allowAccess)
{
    # Looks for current Google account session
    $user = false;
    if ($requireGoogleAccount)
        $user = UserService::getCurrentUser();
        
    if ($requireGoogleAccount && !$user) {
      header('Location: ' . UserService::createLoginURL($_SERVER['REQUEST_URI']));
    }
    else 
    {
        // if we have a query string param specifying a proxy, then do the proxy.
        if (isset($_REQUEST['proxyfor']))
        {
            $proxyfor = $_REQUEST['proxyfor'];
            $qstring = $_SERVER['QUERY_STRING'];
            $url = '/';
            
            
            if ($proxyfor == 'aavso-vsp'){
                $url = "https://www.aavso.org/apps/vsp/api/chart/?star=" . urlencode($_REQUEST['star']) . '&fov=' . $_REQUEST['fov'] 
                        . '&format=' . $_REQUEST['format'] . '&maglimit=' . $_REQUEST['maglimit'];
            }
            if ($proxyfor == 'aavso-vsp-chart-id'){
                $url = "https://www.aavso.org/apps/vsp/api/chart/" . $_REQUEST['chartID'] . '/?format=' . $_REQUEST['format'] ;
            }
                        
            if ($proxyfor == 'casu-adc-tycho'){
                $url = "http://apm5.ast.cam.ac.uk/cgi-bin/wdb/hipp/tycho/query?tab_box=on&tab_vtmag=on&max_rows_returned=1000&ra=" . $_REQUEST['ra'] . '&dec='. $_REQUEST['dec'] .
                 '&box=' . $_REQUEST['box'] . '&vtmag=' . $_REQUEST['vtmag'];
            }

            $contextArr = [
              'http' => [
                'method' => 'GET',
                'timeout' => 120
              ]
            ];
        
            $context = stream_context_create($contextArr);
            $result = file_get_contents($url, false, $context);
            echo ($result);
        }
        else // do the GUI
        {
            require('index.html');
    ?><script type="text/javascript" async>
        // do some alterations to the page and objects
        var reassignURLs = function() {
        
            var doneInit = false;

            try {
                doneInit = Initialization.doneInit;
            } catch (err) {}
            
            if (!doneInit) {
                setTimeout (function() { reassignURLs(); }, 100);
                return;
            }
            
            var container = document.getElementById("topmenu");        
            if (!container)
                return;
            <?php
            if ($requireGoogleAccount)
            {
            ?>
                container.innerHTML = container.innerHTML + 
                                     ' | Logged in as <?php echo $user->getNickname() ?>' +
                                     ' | <a href="https://www.google.com/accounts/ManageAccount" target="_blank">My Account</a>' + 
                                     ' | <a href="<?php echo UserService::createLogoutURL("http://extinction-o-meter.appspot.com") ?>">Sign out</a>';        
            <?php
            }
            ?>
            var protocol = document.location.protocol;
            var host = "<?php echo $_SERVER['SERVER_NAME']; ?>";
            var port = "<?php if (isset($_SERVER['SERVER_PORT'])) echo $_SERVER['SERVER_PORT']; ?>";
            var URI = protocol + "//" + host;
            if (port != "")
                URI = URI + ":" + port;
            var proxyURL = URI + "/index.php";
            // have the PHP re-do the URLs to point to us
            Hipparcos.config.url = proxyURL;
            PhotmetryTable.AAVSO.configFromStarName.url = proxyURL + "?format=json";
            PhotmetryTable.AAVSO.configFromChartID.url_prefix = proxyURL + "?format=json&proxyfor=aavso-vsp-chart-id&chartID=";
            PhotmetryTable.AAVSO.configFromChartID.url_suffix = "";
            
            // display the version 
            AppVersion.updateVersionString = function () {
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function() {
                    if (4 != this.readyState)
                        return;
        			
        			var doc =  this.responseText;
                    // this is now JSON!
                    var manifest = JSON.parse (doc);
                    AppVersion.version = manifest.version;
                    AppVersion.onVersionUpdated();
        		}
        		xmlhttp.open("GET", URI + "/manifest.json", true);
                xmlhttp.send(null);
            }
            
            AppVersion.updateVersionString();
        }
        
        reassignURLs();
        
    </script><?php        
        }
    }
}
else
{   // redirect them to the project page, so they can select a downloadable package
    header('Location: https://bitbucket.org/herr_alien/extinction-o-meter/');
}
