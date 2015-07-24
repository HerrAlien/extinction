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
?>

<html>

<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Extinction-O-Meter</title>
	<link rel="stylesheet" type="text/css" href="style/default.css"  />
</head>

  <body>
    <div id="container">  
      <div id="banner">
      Extinction-O-Meter<br>
      <span>an utility to apply differential extinction corrections to brightness estimates</span>
      </div>
      
      <div id="mainarea">
        <div id="wizard">        
        <ol>
          <li>
            Date & time (JD or UTC yyyy/mm/dd hh:mm:ss):  <input placeholder="[JD or yyyy/mm/dd hh:mm:ss]" id="dateTime" size="25">
          </li>
          <li>
            Location (0.5 degree accuracy is enough):<br>
            Latitude: <input placeholder="[degrees]" id="lat" size="7">, longitude: <input placeholder="[degrees]" id="long" size="7"> (or <a class="addAnchor" nohref id="geolocation">get them from Geolocation</a>).
          </li>

          <li>
              Chart and photometry table:<br>
              Name of the variable star: <input placeholder="[name of star]" id="variableStarName" size="10"><br>
              Limiting magnitude: <input placeholder="[number]" id="mag" size="7">,
              FOV [arc minutes]: <input placeholder="[number]" id="fov" size="7"><br>
         Chart orientation: 
         <select id="chartOrientation" value="0"> 
        <option value="0">North up, West to the right (binoculars & terestrial instruments)</option>
        <option value="1">South up, East to the right (Newtons, refractors & SCTs)</option>
        <option value="2">North up, East to the right (refractors & SCTs with diagonals)</option>
         </select>
         <br>
                <input type="button" value="Update Chart" id="updateChart">
          </li>
    
          <li>
              Brightness estimate (A (brightness steps) V (brightness steps) B)<br>
              <table>
                <tr class="header">
                    <td>Bright star</td>
                    <td>steps</td>
                    <td>Variable</td>
                    <td>steps</td>
                    <td>Dim star</td>
                    <td><a nohref id="addEstimateLink" class="addAnchor">(+) Add row</a></td>
                </tr>
                <tbody id="extraEstimates">
                </tbody>
                
              </table>
              <br><hr>
              Without considering extinction, brightness of V is:<br>
              <span id="brightnessNoExtinction">unknown</span>
              <br>Air mass for variable star V is <span id="airmassV">unknown</span><br>
              <br>
              For the airmass values above, you should <span id="shouldComputeExtinction">not need to</span> correct for extinction.<br>
              <hr><br>
          </li>
          
          <li> Extinction coefficient (K)<br>
              <input type="radio" id="useValueForK" checked="on"> <label for="useValueForK">Use value:</label> <input id="K" placeholder="[number]" size="5" value="0"><br>
              <input type="radio" id="computeK"> <label for="computeK">Or compute it from observations (using</label> <a target="_blank" href="https://docs.google.com/document/d/18RcrzoP0-Xy8_-xsWbnwWAj2m1lAL5WrHUm5S-Neu7Y/edit?usp=sharing">this method</a>):<br>
              <input type="radio" id="useArgelander"><label for="useArgelander">Argelander comparisons</label> <input type="radio" id="usePaired"><label for="usePaired">Paired comparisons</label>
              <table>
                <tr id="extinctionEstimatesHeader">
                </tr>
                <tbody id="extinctionEstimates">
                </tbody>
              </table>
          </li>

          <li>
          Considering extinction, brightness of V is:<br>
          <span id="brightnessWithExtinction">unknown</span>
          </li>

        </ol>
        </div>
        
          <b><div id="debug">&nbsp;</div></b><br>
            <svg width="540" height="540" xmlns="http://www.w3.org/2000/svg">
                <g id="svgimage">
                  <g>
                    <rect x="1" y="1" width="498" height="498" stroke="black" stroke-width="1" fill-opacity="0"></rect><rect fill="white" x="250" y="0" width="10" height="10"></rect><text x="251" y="8" style="font-size: 9px; font-family: Arial;">N</text><rect fill="white" x="0" y="250" width="10" height="10"></rect><text x="1" y="258" style="font-size: 9px; font-family: Arial;">E</text><rect fill="white" x="490" y="250" width="10" height="10"></rect><text x="491" y="258" style="font-size: 9px; font-family: Arial;">W</text><rect fill="white" x="250" y="490" width="10" height="10"></rect><text x="251" y="498" style="font-size: 9px; font-family: Arial;">S</text></g><g><circle cx="498.87109099041254" cy="126.24400975136177" r="1.127544023629519" fill="black"></circle><circle cx="493.6357629436661" cy="426.10107266320364" r="1.0523416045046452" fill="black"></circle><circle cx="489.14771213301896" cy="245.82678307610368" r="1.362209113691688" fill="black"></circle><circle cx="487.38473588944873" cy="447.51290424364254" r="1.4595552798653477" fill="black"></circle><circle cx="486.36706061392033" cy="282.8010948276348" r="1.7370572574135281" fill="black"></circle><circle cx="486.3236119622227" cy="282.81072330981743" r="1.0523416045046452" fill="black"></circle><circle cx="485.80799985474187" cy="490.96977638367434" r="1.0618587587949346" fill="black"></circle><circle cx="481.8892897891772" cy="123.17084434396936" r="1.9703996278182194" fill="black"></circle><circle cx="480.5636488183111" cy="35.872790135271856" r="1.2599607077941133" fill="black"></circle><circle cx="479.3521700649371" cy="134.84054360442437" r="1.1107512712804688" fill="black"></circle><circle cx="470.8644698010165" cy="478.4811993250314" r="1.0273774737514374" fill="black"></circle><circle cx="469.12446933537024" cy="435.4031110128752" r="1.2300713413387387" fill="black"></circle><circle cx="468.48290872748964" cy="97.29150152719467" r="1.4508211328140048" fill="black"></circle><circle cx="463.9526860550385" cy="45.93889282693286" r="1.0650502321792368" fill="black"></circle><circle cx="462.4994515178553" cy="134.7967723555382" r="1.621202882614556" fill="black"></circle><circle cx="462.35839769385404" cy="134.9114912978617" r="1.2045003664648695" fill="black"></circle><circle cx="462.16270149325555" cy="222.7503340468599" r="1.1007959065586035" fill="black"></circle><circle cx="461.38119216508426" cy="95.74419080206397" r="1.0844015195916246" fill="black"></circle><circle cx="456.0368570512761" cy="136.74688046263913" r="1.3745286440182916" fill="black"></circle><circle cx="449.93984438550183" cy="423.42445828213306" r="1.362209113691688" fill="black"></circle><circle cx="448.8008068882857" cy="266.1436846723271" r="2.024344191908655" fill="black"></circle><circle cx="447.82039695143715" cy="137.68909414895876" r="1.0491882131241292" fill="black"></circle><circle cx="445.46849561031894" cy="463.0090686275911" r="1.042909749907027" fill="black"></circle><circle cx="443.8301059869256" cy="287.0261115079824" r="2.749316888275674" fill="black"></circle><circle cx="440.1428140697467" cy="426.40007290620446" r="1.3745286440182916" fill="black"></circle><circle cx="435.1373949861102" cy="63.74853025170714" r="1.2449263262821668" fill="black"></circle><circle cx="429.51840167022766" cy="238.35185563636654" r="2.0797656218865095" fill="black"></circle><circle cx="425.9970826522464" cy="63.89003604628408" r="1.161895003862225" fill="black"></circle><circle cx="424.37893312020594" cy="164.40790469161215" r="1.0876607464511379" fill="black"></circle><circle cx="421.4012105545909" cy="442.8258086718651" r="1.137741292649427" fill="black"></circle><circle cx="417.4836263048148" cy="343.9614761254987" r="1.1937047538323895" fill="black"></circle><circle cx="416.8726991083819" cy="294.57861832780515" r="1.5130755047828832" fill="black"></circle><circle cx="411.69616987225123" cy="370.8608336444729" r="1.2944552489995895" fill="black"></circle><circle cx="410.66486520048653" cy="171.59078037617917" r="1.104104407626408" fill="black"></circle><circle cx="409.6657753113569" cy="23.264600237902386" r="1.161895003862225" fill="black"></circle><circle cx="406.6865997189219" cy="120.30569492909709" r="1.844509463312862" fill="black"></circle><circle cx="405.13977039031084" cy="249.35161655505146" r="1.1514812516289032" fill="black"></circle><circle cx="394.7986859394339" cy="325.28738002125573" r="1.0618587587949346" fill="black"></circle><circle cx="393.9159505613325" cy="54.045753382767" r="2.5813964498652804" fill="black"></circle><circle cx="390.7809781074227" cy="70.52023067033053" r="1.5780011962835654" fill="black"></circle><circle cx="384.848848333957" cy="45.70275614379028" r="1.6407813766434234" fill="black"></circle><circle cx="384.8422236836594" cy="37.09957462677002" r="1.3581271896670288" fill="black"></circle><circle cx="383.34931273252846" cy="390.6871449834922" r="1.024298888569215" fill="black"></circle><circle cx="382.0113489215204" cy="353.2178312924225" r="1.0181693659394753" fill="black"></circle><circle cx="380.8965306322679" cy="440.3372401035184" r="1.024298888569215" fill="black"></circle><circle cx="376.2744079456837" cy="41.05789362907498" r="1.0273774737514374" fill="black"></circle><circle cx="371.871803548951" cy="480.9061828210236" r="1.097497319570699" fill="black"></circle><circle cx="371.25664719896554" cy="234.18404434680411" r="1.2117516278961773" fill="black"></circle><circle cx="371.21357583754786" cy="243.17779152295662" r="1.2790092641024302" fill="black"></circle><circle cx="369.94969808022296" cy="378.5206844979625" r="1.3338912317538358" fill="black"></circle><circle cx="369.7959973922179" cy="445.0633735407456" r="3.1944175565215454" fill="black"></circle><circle cx="367.1526948035762" cy="203.33552857385493" r="2.024344191908655" fill="black"></circle><circle cx="364.32087067599895" cy="392.97655055798634" r="1.02122952851307" fill="black"></circle><circle cx="363.14933544344467" cy="167.67788444432983" r="1.161895003862225" fill="black"></circle><circle cx="353.2909683165317" cy="411.5642939628224" r="1.0397846215248217" fill="black"></circle><circle cx="349.3146785804725" cy="463.4105626090568" r="1.1865614869759118" fill="black"></circle><circle cx="348.8553897397914" cy="272.2808196319924" r="3.634420760018847" fill="black"></circle><circle cx="347.53090552171983" cy="179.6004054901244" r="1.024298888569215" fill="black"></circle><circle cx="345.56714984702353" cy="150.54676324459714" r="1.2524209576711833" fill="black"></circle><circle cx="342.5877627941628" cy="237.68210800146406" r="1.2867090795655762" fill="black"></circle><circle cx="340.67532606251297" cy="493.0938338446381" r="1.7846134968831107" fill="black"></circle><circle cx="337.10688628998247" cy="442.74953256844094" r="1.6407813766434234" fill="black"></circle><circle cx="333.4081971192697" cy="431.8855527732617" r="1.5591718217923793" fill="black"></circle><circle cx="329.7768338933007" cy="384.181719788744" r="1.009043787919769" fill="black"></circle><circle cx="329.1125769908713" cy="385.43662996385973" r="4.7471423895781015" fill="black"></circle><circle cx="323.8216370343869" cy="295.2672601562898" r="1.5313481960378126" fill="black"></circle><circle cx="321.8038657956025" cy="40.98590493202806" r="1.9007030192055567" fill="black"></circle><circle cx="321.7349150181708" cy="425.7020949045834" r="1.2905763526343919" fill="black"></circle><circle cx="318.3335697235446" cy="374.4913544262185" r="1.2263853743974018" fill="black"></circle><circle cx="313.56014421039305" cy="286.27170080678565" r="1.0779123358892526" fill="black"></circle><circle cx="307.05999640265156" cy="193.2300991662931" r="1.2153936123284617" fill="black"></circle><circle cx="306.4658799085843" cy="272.00513651128927" r="1.3869595895644407" fill="black"></circle><circle cx="305.55861253162294" cy="163.12161048989262" r="3.4953592164972083" fill="black"></circle><circle cx="304.74266018287574" cy="196.26246967359464" r="1.2411958456759915" fill="black"></circle><circle cx="304.6474229202681" cy="102.78125501864801" r="1.009043787919769" fill="black"></circle><circle cx="299.4578314135544" cy="191.92263502626156" r="1.104104407626408" fill="black"></circle><circle cx="297.9538717880487" cy="258.20819041862507" r="1.03356243048389" fill="black"></circle><circle cx="297.45195075282686" cy="498.04973874402265" r="1.1174381499875725" fill="black"></circle><circle cx="296.915519283983" cy="159.0309902577113" r="1.1107512712804688" fill="black"></circle><circle cx="289.98294927246053" cy="109.05540131715065" r="1.009043787919769" fill="black"></circle><circle cx="286.3008464871392" cy="350.6676378740998" r="1.621202882614556" fill="black"></circle><circle cx="285.617887190121" cy="446.2725240340594" r="1.0060201404940954" fill="black"></circle><circle cx="281.29825943490397" cy="5.032023158637543" r="1.1309329175961014" fill="black"></circle><circle cx="277.60212069577415" cy="1.1459261762270785" r="1.0060201404940954" fill="black"></circle><circle cx="277.17870818925496" cy="409.58174199143224" r="1.01511837328774" fill="black"></circle><circle cx="272.93629845060195" cy="130.48872009512542" r="1.0523416045046452" fill="black"></circle><circle cx="272.0418191337489" cy="494.7034746753427" r="1.2411958456759915" fill="black"></circle><circle cx="272.0363317008504" cy="494.85457607916044" r="1.5176231342693458" fill="black"></circle><circle cx="268.9059109138412" cy="128.56326068922772" r="1.568558255214004" fill="black"></circle><circle cx="268.4648356704991" cy="351.35238200104635" r="1.6756143916625885" fill="black"></circle><circle cx="264.8559784385873" cy="133.3011540820304" r="1.1445906550771106" fill="black"></circle><circle cx="259.8495777317691" cy="48.535370927537116" r="1.168889775024863" fill="black"></circle><circle cx="259.6047212621944" cy="8.686190530667886" r="1.0397846215248217" fill="black"></circle><circle cx="259.30736002865916" cy="348.2248197970694" r="1.0397846215248217" fill="black"></circle><circle cx="257.55583472141103" cy="274.9907890952643" r="1.024298888569215" fill="black"></circle><circle cx="255.89750781243174" cy="269.0889196720288" r="1.2117516278961773" fill="black"></circle><circle cx="249.3358780802738" cy="239.73069957605816" r="1.0650502321792368" fill="black"></circle><circle cx="244.0621999001682" cy="62.581202911552" r="1.3745286440182916" fill="black"></circle><circle cx="240.32060013355772" cy="115.40538763406354" r="1.4421392519054839" fill="black"></circle><circle cx="239.17001112694965" cy="277.2278797764663" r="1.042909749907027" fill="black"></circle><circle cx="237.97660325416683" cy="53.86095662039935" r="1.4079281623744864" fill="black"></circle><circle cx="237.08742528403764" cy="107.34202636847778" r="1.0876607464511379" fill="black"></circle><circle cx="235.45761463186065" cy="379.99395976133474" r="1.1074228525714114" fill="black"></circle><circle cx="231.76566175352346" cy="29.07749024603504" r="1.104104407626408" fill="black"></circle><circle cx="219.60241395003487" cy="123.60342834336306" r="1.2675458482720738" fill="black"></circle><circle cx="213.05182566057348" cy="9.083906596753792" r="1.1865614869759118" fill="black"></circle><circle cx="207.7031566052084" cy="484.60655744688745" r="1.7580348694735464" fill="black"></circle><circle cx="205.53686328994613" cy="443.97812661951843" r="1.2300713413387387" fill="black"></circle><circle cx="205.44990516526133" cy="9.94323054894889" r="1.0779123358892526" fill="black"></circle><circle cx="204.3573811028076" cy="416.91189788964084" r="1.9007030192055567" fill="black"></circle><circle cx="201.23562698795413" cy="152.92363192202714" r="1.4249310393220453" fill="black"></circle><circle cx="198.23780967806022" cy="52.600944375348774" r="1.2190465429400612" fill="black"></circle><circle cx="198.22873822408548" cy="422.3010508644911" r="1.137741292649427" fill="black"></circle><circle cx="196.0993175844684" cy="202.050920730633" r="3.156300421633039" fill="black"></circle><circle cx="193.84837800854947" cy="17.280467916912272" r="1.1865614869759118" fill="black"></circle><circle cx="193.57058332779786" cy="214.63964004885048" r="1.1241652846439598" fill="black"></circle><circle cx="191.8410664995302" cy="87.56895461826579" r="1.626075494727574" fill="black"></circle><circle cx="189.0854079166353" cy="267.4177779096343" r="1.0304653117863474" fill="black"></circle><circle cx="182.363119017371" cy="34.227578213853064" r="1.01511837328774" fill="black"></circle><circle cx="180.1858789792216" cy="6.9131740504453205" r="1.0366688577375933" fill="black"></circle><circle cx="180.04475357993024" cy="373.55514623794295" r="1.01511837328774" fill="black"></circle><circle cx="179.32454748396287" cy="451.4258600571749" r="1.02122952851307" fill="black"></circle><circle cx="175.0475880985274" cy="343.7417649681017" r="1.097497319570699" fill="black"></circle><circle cx="173.5959484586138" cy="394.5463192929118" r="1.1309329175961014" fill="black"></circle><circle cx="171.71208207570152" cy="5.472410758709316" r="1.0746823206029665" fill="black"></circle><circle cx="171.22094884735708" cy="35.49938704237539" r="1.7060592427181578" fill="black"></circle><circle cx="163.938312589625" cy="81.79804114820439" r="1.2374765436313582" fill="black"></circle><circle cx="162.96848752625465" cy="34.75204492781137" r="1.024298888569215" fill="black"></circle><circle cx="155.8794341916106" cy="75.75506574207688" r="1.1343319970650463" fill="black"></circle><circle cx="153.81116746664952" cy="193.62210819580875" r="1.2337683866511782" fill="black"></circle><circle cx="152.90700842052635" cy="261.18138371332714" r="1.3100877676898488" fill="black"></circle><circle cx="152.42606446073296" cy="294.7128045411448" r="1.1107512712804688" fill="black"></circle><circle cx="146.28442257663312" cy="325.8990231691099" r="1.0650502321792368" fill="black"></circle><circle cx="145.49121371561375" cy="22.124454373962436" r="1.0181693659394753" fill="black"></circle><circle cx="144.300658417376" cy="61.63016905402884" r="1.4860744738541147" fill="black"></circle><circle cx="143.2549163485144" cy="96.40356807970377" r="1.9064156839521773" fill="black"></circle><circle cx="137.35346371772033" cy="94.56144620471929" r="1.8225000000000002" fill="black"></circle><circle cx="136.43572515653904" cy="184.8453259932096" r="4.390818432393784" fill="black"></circle><circle cx="135.64323422790494" cy="460.8545615716289" r="1.168889775024863" fill="black"></circle><circle cx="135.39777435550428" cy="257.0620432315849" r="1.0779123358892526" fill="black"></circle><circle cx="131.79018020735057" cy="107.13295167688537" r="1.3786598634926446" fill="black"></circle><circle cx="129.03271431327875" cy="318.3827119714525" r="1.1794609662517743" fill="black"></circle><circle cx="127.65518017889443" cy="459.7565320556106" r="1.6358646976598394" fill="black"></circle><circle cx="123.50047609403171" cy="43.8854807619272" r="1.7899772483513692" fill="black"></circle><circle cx="121.0783916403604" cy="55.250903325145686" r="2.833075684476464" fill="black"></circle><circle cx="118.27271167467407" cy="38.00484290375141" r="1.0181693659394753" fill="black"></circle><circle cx="117.26002662177928" cy="149.5913241456019" r="1.1174381499875725" fill="black"></circle><circle cx="117.17557640065871" cy="302.19073455655877" r="1.3140253066582397" fill="black"></circle><circle cx="116.8097818142335" cy="91.0112017815459" r="1.2905763526343919" fill="black"></circle><circle cx="114.87010615451445" cy="453.7899229004308" r="1.9178925742097164" fill="black"></circle><circle cx="110.67116253511924" cy="8.960712006397614" r="1.1309329175961014" fill="black"></circle><circle cx="104.32245516791002" cy="151.21814875365794" r="1.2117516278961773" fill="black"></circle><circle cx="100.31261098104576" cy="452.6222483022882" r="1.0942086169546863" fill="black"></circle><circle cx="100.2031407294314" cy="452.6387816933651" r="1.1937047538323895" fill="black"></circle><circle cx="96.71619411785451" cy="95.16529264371064" r="1.2599607077941133" fill="black"></circle><circle cx="91.50344198272467" cy="148.83385794756157" r="1.5085415024832232" fill="black"></circle><circle cx="90.56192486127495" cy="273.5697321165248" r="3.7339220189779434" fill="black"></circle><circle cx="87.73236473830369" cy="8.104357197305461" r="1.345954661161857" fill="black"></circle><circle cx="87.39950663143586" cy="4.470274354396423" r="1.2117516278961773" fill="black"></circle><circle cx="86.28195733352837" cy="482.824020141298" r="1.4683420077090361" fill="black"></circle><circle cx="80.37464700461874" cy="100.20007004617241" r="1.0397846215248217" fill="black"></circle><circle cx="79.23915866634735" cy="302.4676499215811" r="1.568558255214004" fill="black"></circle><circle cx="77.57795237861149" cy="71.23039176252138" r="2.6361982794012326" fill="black"></circle><circle cx="66.67497294111965" cy="452.6703873463589" r="2.2962783899547716" fill="black"></circle><circle cx="63.784672789610426" cy="471.5696055783048" r="1.2905763526343919" fill="black"></circle><circle cx="63.38204784787081" cy="218.8672804778998" r="3.017367915533008" fill="black"></circle><circle cx="63.18807508192245" cy="90.21100891610709" r="1.0366688577375933" fill="black"></circle><circle cx="59.77266495117024" cy="242.80049450504634" r="1.3379003133086445" fill="black"></circle><circle cx="55.18191083662404" cy="144.1308190970389" r="1.2374765436313582" fill="black"></circle><circle cx="54.957061126143856" cy="9.240672333328945" r="1.5313481960378126" fill="black"></circle><circle cx="52.06643515864087" cy="0.6396269634521161" r="1.1411608350543259" fill="black"></circle><circle cx="52.04078032838186" cy="107.54621855914039" r="1.104104407626408" fill="black"></circle><circle cx="51.78656100881258" cy="154.62553964850747" r="1.042909749907027" fill="black"></circle><circle cx="47.43160958453839" cy="473.9651387029711" r="2.38763495661475" fill="black"></circle><circle cx="46.5803075045275" cy="430.0441189997564" r="1.1480307836077122" fill="black"></circle><circle cx="45.79900422005639" cy="205.11200969094213" r="1.046044271030001" fill="black"></circle><circle cx="45.58426886967462" cy="53.155362043020034" r="3.4226969735065524" fill="black"></circle><circle cx="45.34231275147212" cy="22.286074333701123" r="1.3022480514618862" fill="black"></circle><circle cx="41.1882373909402" cy="276.70963800808" r="1.1514812516289032" fill="black"></circle><circle cx="35.78933837252001" cy="264.2173652835507" r="1.2411958456759915" fill="black"></circle><circle cx="30.41077854088101" cy="465.82688148060254" r="1.137741292649427" fill="black"></circle><circle cx="28.484394864161004" cy="69.14279152248304" r="1.2008910241589301" fill="black"></circle><circle cx="24.251030115286113" cy="493.70984520129963" r="1.02122952851307" fill="black"></circle><circle cx="23.66003173822756" cy="175.17517968829412" r="1.4464736786838037" fill="black"></circle><circle cx="17.830714259616883" cy="79.25048760126822" r="1.003005553570914" fill="black"></circle><circle cx="14.903541659295456" cy="272.3590047732388" r="1.0366688577375933" fill="black"></circle><circle cx="8.96761087065775" cy="159.03151006749076" r="1.8950074727289878" fill="black"></circle><circle cx="8.887299877306305" cy="132.22274017706874" r="1.2524209576711833" fill="black"></circle><circle cx="8.648464147226917" cy="449.80639098882585" r="1.0120765230797595" fill="black"></circle></g><g><line x1="243" y1="250" x2="257" y2="250" stroke="black" stroke-width="1"></line><line x1="250" y1="243" x2="250" y2="257" stroke="black" stroke-width="1"></line><circle cx="250" cy="250" r="3" fill="white" stroke="black" stroke-width="1"></circle></g><g><text x="139.4349314534483" y="191.8449627040805" style="font-size: 11px; font-family: Arial;">20</text><text x="93.56277534874783" y="280.56966627494467" style="font-size: 11px; font-family: Arial;">26</text><text x="351.85347481449367" y="279.282556709576" style="font-size: 11px; font-family: Arial;">27</text><text x="308.56133253554617" y="170.13285911804823" style="font-size: 11px; font-family: Arial;">28</text><text x="48.58488117242436" y="60.15547226586207" style="font-size: 11px; font-family: Arial;">29</text><text x="446.83330968801306" y="294.0375423808309" style="font-size: 11px; font-family: Arial;">30</text><text x="199.0956263947182" y="209.0509219693299" style="font-size: 11px; font-family: Arial;">32</text><text x="66.3852064719652" y="225.8823179727215" style="font-size: 11px; font-family: Arial;">33</text><text x="124.07626587996151" y="62.25205982317502" style="font-size: 11px; font-family: Arial;">35</text><text x="80.57314752273837" y="78.23404949216922" style="font-size: 11px; font-family: Arial;">38</text><text x="50.42549435157994" y="480.97096841674636" style="font-size: 11px; font-family: Arial;">41</text><text x="69.66796807088315" y="459.68788297130675" style="font-size: 11px; font-family: Arial;">42</text><text x="432.5166512603685" y="245.35345233249265" style="font-size: 11px; font-family: Arial;">46</text><text x="370.152031328174" y="210.33565937234272" style="font-size: 11px; font-family: Arial;">47</text><text x="11.964038209535062" y="166.03351948489382" style="font-size: 11px; font-family: Arial;">48</text><text x="146.25443331316438" y="103.40378964873989" style="font-size: 11px; font-family: Arial;">48</text><text x="324.80483086973186" y="47.98644827265946" style="font-size: 11px; font-family: Arial;">48</text><text x="140.34638586522675" y="101.56263199338477" style="font-size: 11px; font-family: Arial;">50</text><text x="489.3671903241822" y="289.8007452322575" style="font-size: 11px; font-family: Arial;">50</text><text x="409.6863845578701" y="127.30701218180607" style="font-size: 11px; font-family: Arial;">50</text><text x="126.50030947732486" y="50.88535163937465" style="font-size: 11px; font-family: Arial;">51</text><text x="174.22103001540356" y="42.4976152005047" style="font-size: 11px; font-family: Arial;">52</text><text x="271.46400952110616" y="358.35305752694273" style="font-size: 11px; font-family: Arial;">53</text><text x="465.4996078811482" y="141.79781429936781" style="font-size: 11px; font-family: Arial;">53</text><text x="393.78206315634634" y="77.5218163871034" style="font-size: 11px; font-family: Arial;">54</text><text x="194.8386745275153" y="94.56857379859233" style="font-size: 11px; font-family: Arial;">54</text><text x="387.84818938936075" y="52.703096640757906" style="font-size: 11px; font-family: Arial;">54</text><text x="419.8724828461703" y="301.58082980227357" style="font-size: 11px; font-family: Arial;">55</text><text x="326.83039369415377" y="302.27167853498355" style="font-size: 11px; font-family: Arial;">56</text><text x="147.30082787173617" y="68.63102928581435" style="font-size: 11px; font-family: Arial;">57</text><text x="94.5031538516537" y="155.83373010742184" style="font-size: 11px; font-family: Arial;">57</text><text x="103.23470773316379" y="459.6358654432827" style="font-size: 11px; font-family: Arial;">58</text><text x="243.32108937756587" y="122.40649499310138" style="font-size: 11px; font-family: Arial;">58</text><text x="309.4659579809694" y="279.00410040949504" style="font-size: 11px; font-family: Arial;">59</text><text x="134.79077798172844" y="114.13375032758319" style="font-size: 11px; font-family: Arial;">59</text><text x="459.03707435786043" y="143.74672904920092" style="font-size: 11px; font-family: Arial;">60</text><text x="387.841947022049" y="44.09959967733698" style="font-size: 11px; font-family: Arial;">60</text><text x="62.77249894189626" y="249.80093795826141" style="font-size: 11px; font-family: Arial;">60</text><text x="119.8098517134587" y="98.0105560678025" style="font-size: 11px; font-family: Arial;">61</text><text x="120.17931008742178" y="309.19354302742244" style="font-size: 11px; font-family: Arial;">61</text><text x="66.79930856309704" y="478.5925189642368" style="font-size: 11px; font-family: Arial;">62</text><text x="374.2125787775327" y="250.17856558434318" style="font-size: 11px; font-family: Arial;">62</text><text x="348.5664734591537" y="157.54699003521097" style="font-size: 11px; font-family: Arial;">62</text><text x="222.60275485405683" y="130.60357126274062" style="font-size: 11px; font-family: Arial;">62</text><text x="345.58715344368557" y="244.68255023934032" style="font-size: 11px; font-family: Arial;">62</text><text x="99.71573147346498" y="102.1651401455344" style="font-size: 11px; font-family: Arial;">62</text><text x="310.05981373193765" y="200.23215956881904" style="font-size: 11px; font-family: Arial;">63</text><text x="307.7429952426188" y="203.26463480541446" style="font-size: 11px; font-family: Arial;">63</text><text x="38.787429201738775" y="271.21832872800087" style="font-size: 11px; font-family: Arial;">63</text><text x="438.1375107569294" y="70.74871174659964" style="font-size: 11px; font-family: Arial;">63</text><text x="412.66601337618033" y="30.26361504534148" style="font-size: 11px; font-family: Arial;">63</text><text x="107.32254044135658" y="158.21838746489155" style="font-size: 11px; font-family: Arial;">64</text><text x="374.24747594887344" y="241.193070697281" style="font-size: 11px; font-family: Arial;">64</text><text x="258.8976612380249" y="276.0896889057865" style="font-size: 11px; font-family: Arial;">64</text><text x="201.23562742509645" y="59.60256308319035" style="font-size: 11px; font-family: Arial;">64</text><text x="366.1491748175702" y="174.68016648291052" style="font-size: 11px; font-family: Arial;">65</text><text x="428.9965492074326" y="70.88992856178442" style="font-size: 11px; font-family: Arial;">65</text><text x="408.13861120015883" y="256.35191177054037" style="font-size: 11px; font-family: Arial;">65</text><text x="196.5687408231854" y="221.63808654197766" style="font-size: 11px; font-family: Arial;">66</text><text x="49.58154247462883" y="437.0449163373906" style="font-size: 11px; font-family: Arial;">66</text><text x="376.9758923758073" y="227.00802462711368" style="font-size: 11px; font-family: Arial;">66</text><text x="166.93908973338856" y="88.80019495784862" style="font-size: 11px; font-family: Arial;">66</text><text x="158.8769360469289" y="82.75805117975398" style="font-size: 11px; font-family: Arial;">66</text><text x="55.0644794906527" y="7.639356801160346" style="font-size: 11px; font-family: Arial;">66</text><text x="120.2599395025315" y="156.59153976626968" style="font-size: 11px; font-family: Arial;">66</text><text x="240.0871231147705" y="114.34197137692888" style="font-size: 11px; font-family: Arial;">67</text><text x="55.040765191561405" y="114.5469369281029" style="font-size: 11px; font-family: Arial;">67</text><text x="252.33582710425458" y="246.73879578243125" style="font-size: 11px; font-family: Arial;">68</text><text x="316.5593745622526" y="293.2753625865293" style="font-size: 11px; font-family: Arial;">68</text><text x="397.7990232398083" y="332.2877239628461" style="font-size: 11px; font-family: Arial;">68</text><text x="385.01168837971056" y="360.2178934843835" style="font-size: 11px; font-family: Arial;">69</text><text x="148.49066710012198" y="29.125755093844703" style="font-size: 11px; font-family: Arial;">69</text><text x="300.9535373398234" y="265.2109409881869" style="font-size: 11px; font-family: Arial;">69</text><text x="262.3064721170129" y="355.22438616189174" style="font-size: 11px; font-family: Arial;">69</text><text x="66.18783616892674" y="97.21144470843296" style="font-size: 11px; font-family: Arial;">69</text><text x="17.901751667821088" y="279.3590396732616" style="font-size: 11px; font-family: Arial;">69</text><text x="450.82048247218563" y="144.68902890857538" style="font-size: 11px; font-family: Arial;">69</text><text x="350.53069269674745" y="186.60003884791402" style="font-size: 11px; font-family: Arial;">69</text><text x="371.4120540702172" y="367.79861626651484" style="font-size: 11px; font-family: Arial;">70</text><text x="307.64708711879393" y="109.78019524178015" style="font-size: 11px; font-family: Arial;">70</text><text x="350.1120127722269" y="306.85205155540893" style="font-size: 11px; font-family: Arial;">70</text><text x="427.33062086164887" y="283.36258292057676" style="font-size: 11px; font-family: Arial;">70</text>
                  </g>
				<g>
				<rect x="40" y="12" width="420" height="32" stroke="black" stroke-width="1" fill="white"></rect>
				<text x="45" y="30" style="font-size: 18px; font-family: Arial;">Non-functional sample chart (Nova Sgr 2015 No. 2)</text>
				</g>
                </g>			
            </svg>
        
      </div>
 
        <div class="clear">&nbsp;</div>
 
	  <div id="footer">
		<div id="poweredBy">
			Powered by:<br>
			<div><a href="http://www.aavso.org" target="_blank">AAVSO</a><br>
			<a href="http://www.aavso.org" target="_blank"><img alt="AAVSO" src="resources/aavso-logo.jpg"></a></div>
			<div><a href="http://www.rssd.esa.int" target="_blank">ESA</a><br>
			<a href="http://www.rssd.esa.int" target="_blank"><img alt="RSSD ESA" src="resources/rssd-esa-logo.jpg"></a></div>
			<div><a href="https://www.bitbucket.org" target="_blank">BitBucket</a><br>
			<a href="https://www.bitbucket.org" target="_blank"><img alt="BitBucket" src="resources/bitbucketLogoSmall.png"></a></div>
		
		</div>
		<div style="float: right">
                <div id="donate">
                     <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=D3CKMU6R4DU56" target="_blank">Donate using PayPal</a><br>
                </div>
        </div>

		<div class="clear">&nbsp;</div>
		
        <div id="license">
			Extinction-O-Meter - an HTML & JavaScript utility to apply differential extinction corrections to brightness estimates.<br>
			(source code available at &lt;<a href="https://bitbucket.org/herr_alien/extinction-o-meter" target="_blank">https://bitbucket.org/herr_alien/extinction-o-meter</a>&gt;)<br>
			<br>               
			Copyright 2015  Herr_Alien &lt;garone80@yahoo.com&gt;<br>
			<br>                
			This program is free software: you can redistribute it and/or modify
			it under the terms of the GNU Affero General Public License as published by
			the Free Software Foundation, either version 3 of the License, or
			(at your option) any later version.<br>
			<br>                
			This program is distributed in the hope that it will be useful,
			but WITHOUT ANY WARRANTY; without even the implied warranty of
			MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
			GNU General Public License for more details.<br>
			<br>
			You should have received a copy of the GNU Affero General Public License
			along with this program.  If not, see &lt;<a target="_blank"  href="https://www.gnu.org/licenses/agpl.html">https://www.gnu.org/licenses/agpl.html</a>&gt;.
        </div>

      </div>
    </div>
    
</body>

</html>

<script src="scripts/inputvalidator.js"></script>
<script src="scripts/photometrytable.js"></script>
<script src="scripts/starsselection.js"></script>
<script src="scripts/estimationcorrector.js"></script>
<script src="scripts/extinctioncoefficientalgorithm.js"></script>
<script src="scripts/computations.js"></script>
<script src="scripts/hipparcos.js"></script>
<script src="scripts/svgchart.js"></script>
<script src="scripts/initialize.js"></script>

<?php
}
?>