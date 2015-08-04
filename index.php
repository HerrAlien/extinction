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
$isMobileOrMac = false;
$userAgent = $_SERVER['HTTP_USER_AGENT'];
$isMobileOrMac = stripos ($userAgent, 'kindle') ||
            stripos ($userAgent, 'android') ||
            stripos ($userAgent, 'BlackBerry') ||
            stripos ($userAgent, 'windows phone') ||
            stripos ($userAgent, 'arm') ||
            stripos ($userAgent, 'opera mini') ||
            stripos ($userAgent, 'opera mobi') ||
            (stripos ($userAgent, 'Macintosh') &&  (stripos($userAgent, 'CriOS') == 0)) ||
            (stripos ($userAgent, 'Mac OS') &&  (stripos($userAgent, 'CriOS') == 0)) ||
            stripos ($userAgent, 'iPad');

if ($isMobileOrMac)
{
    # Looks for current Google account session
    $user = UserService::getCurrentUser();
    if (!$user) {
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
                $url = "https://www.aavso.org/cgi-bin/vsp.pl?ccdtable=on&name=" . urlencode($_REQUEST['name']) . '&fov=' . $_REQUEST['fov'];
            }
            if ($proxyfor == 'aavso-vsx'){
                $url = "https://www.aavso.org/vsx/index.php?view=query.votable&ident=" . urlencode($_REQUEST['ident']);
            }
            if ($proxyfor == 'rssd-esa-tycho'){
                $url = "http://www.rssd.esa.int/hipparcos_scripts/HIPcatalogueSearch.pl?raDecim=" . $_REQUEST['raDecim'] . '&decDecim='. $_REQUEST['decDecim'] .
                 '&box=' . $_REQUEST['box'] . '&threshold=' . $_REQUEST['threshold'];
            }
            
            $context = [
              'http' => [
                'method' => 'GET',
                'content' => $data
              ]
            ];
        
            $context = stream_context_create($context);
            $result = file_get_contents($url, false, $context);
            echo ($result);
        }
        else // do the GUI
        {
            require('index.html');
    ?><script type="text/javascript">
        // do some alterations to the page and objects
        (function() {
            var container = document.getElementById("topmenu");        
            if (!container)
                return;
        
            container.innerHTML = container.innerHTML + 
                                 ' | Logged in as <?php echo $user->getNickname() ?> | <a href="https://www.google.com/accounts/ManageAccount" target="_blank">My Account</a> | <a href="<?php echo UserService::createLogoutURL("http://extinction-o-meter.appspot.com") ?>">Sign out</a>';
        
            // have the PHP re-do the URLs to point to us
            PhotmetryTable.AAVSO.configFromStarName.url = "http://extinction-o-meter.appspot.com/index.php?";
            PhotmetryTable.AAVSO.vsxConfig.url = "http://extinction-o-meter.appspot.com/index.php?";
            Hipparcos.config.url = "http://extinction-o-meter.appspot.com/index.php";
        
        })();
    </script><?php        
        }
    }
}
else
{   // redirect them to the project page, so they can select a downloadable package
    header('Location: https://bitbucket.org/herr_alien/extinction-o-meter/');
}
