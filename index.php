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

// if we have a query string param specifying a proxy, then do the proxy.


use google\appengine\api\users\User;
use google\appengine\api\users\UserService;
# Looks for current Google account session
$user = UserService::getCurrentUser();
if (!$user) {
  header('Location: ' . UserService::createLoginURL($_SERVER['REQUEST_URI']));
}
else 
{
    if (isset($_REQUEST['proxyfor']))
    {
        $proxyfor = $_REQUEST['proxyfor'];
        $qstring = $_SERVER['QUERY_STRING'];
        $url = '/';
        
        
        if ($proxyfor == 'aavso-vsp'){
            $url = "http://www.aavso.org/cgi-bin/vsp.pl?ccdtable=on&name=" . urlencode($_REQUEST['name']) . '&fov=' . $_REQUEST['fov'];
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
    (function() {
        var banner = document.getElementById("banner");
        var container = document.getElementById("container");        
        if (!banner || !container)
            return;
        
        var userBar = document.createElement("div");
        userBar.style["text-align"] = "right";
        userBar.style["font-size"] = "10px";
        userBar.style["margin"] = "0px";
        userBar.style["width"] = banner.style["width"];
        userBar.innerHTML = 'Logged in as <b><?php echo $user->getNickname() ?></b> | <a href="https://www.google.com/accounts/ManageAccount" target="_blank">My Account</a> | <a href="<?php echo UserService::createLogoutURL("http://extinction-o-meter.appspot.com") ?>">Sign out</a>';
        
        container.insertBefore(userBar, banner);
        
    })();
</script><?php        
    }
}
