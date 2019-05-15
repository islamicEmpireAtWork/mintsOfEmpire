/* PROBLEMS:
* sometimes clicking a circle segment opens the popup on another circle segment!
  UPDATE: the reason for this seems to be that the white box (which is hidden) around another popup marker, covers the clicked icon
  SOLVED: by setting the width and height of the svg to icon_size
* find a way to remove the white content boxes
  SOLVED: by setting the className of the divIcon to a non-standard value (i.c., circleSegment)
* sometimes more than one dataset seems to be displayed in every decade! probably previous decade as well
  UPDATE: the solution for this may involve having to rewrite part of the Python script to use CE decades instead of AH decades?
* add mints with different name but same location to one popup (e.g. Jūr and Ardashīr Khurra) (in python file)
* does not work in Internet Explorer
* Does not work in Mozilla Firefox - SOLVED
OTHER TO DOs:
* add a legend (size of the markers)
* find a way to resize the map without the right side disappearing from the screen
* simplify the code:
  * create three objects (for AU, AR, AE) that contain the relevant timelines and variables for that metal,
    and pass this object to a unified function (e.g., displayMetal(AU_obj) instead of having functions like displayAU(), displayAR() and displayAE())
  * use display: "block" and display: "none" to hide and show the side panel
DONE:
* add sidepanel code: from https://www.w3schools.com/howto/howto_js_collapse_sidepanel.asp
* give the option to view per year or per decade
*/



// Helper functions and variables:


var checkboxCount = 3;  // number of checkboxes (AU, AR, AE) checked
var auAuthorities = []; // will hold a list of active minting authorities during the displayed timeframe
var arAuthorities = [];
var aeAuthorities = [];
var activeDecade = "";  // the decade currently displayed in the timeline
var sidepanelOpen = false; // to track whether the sidepanel is open or not
var legendOpen = false;
var displayType = "decade"; // display types: year (active mints per year) and decade (active mints per decade)

/* svg paths for the circle thirds (3L = the left third, 3R = the right third, 3B = the bottom third):
var circle_3L_pth = "M20.0,20.0 L2.6795,30.0 A20.0,20.0 0 0,1 20.0,0 Z";
var circle_3R_pth = "M20.0,20.0 L20.0,0 A20.0,20.0 0 0,1 37.3205,30.0 Z";
var circle_3B_pth = "M20.0,20.0 L37.3205,30.0 A20.0,20.0 0 0,1 2.6795,30.0 Z";*/
//var circle_2R_pth = "M20.0,0 a1,1 0 0,1 0,40.0 Z";
//var circle_2L_pth = "M20.0,40.0 a1,1 0 0,1 0,-40.0 Z";



/*function toggleYearDecade() {
  // store the date at which the timeslider currently is
  var currentlyDisplayedDate = slider.time;

  if (displayType === "decade") {
    displayType = "year";
    document.getElementById("yearDecadeToggle").innerHTML = "<p>Show mints per decade</p>";
  }
  else if (displayType === "year") {
    displayType = "decade";
    document.getElementById("yearDecadeToggle").innerHTML = "<p>Show mints per year</p>";
  }
*/
function toggleYearDecade(myRadio) {
  /* toggle between displaying the date per year or per decade
  */
  // store the date at which the timeslider currently is
  var currentlyDisplayedDate = slider.time;
  //alert('New value: ' + myRadio.value);
  if (myRadio.value === "decade") {
    displayType = "decade";
  }
  else if (myRadio.value === "year") {
    displayType = "year";
  }
  AU_mintTimeline3.removeFrom(map);
  AR_mintTimeline3.removeFrom(map);
  AE_mintTimeline3.removeFrom(map);
  createTimelines();

  // display only the metals of which the checkboxes are checked:
  displayAU();
  displayAR();
  displayAE();

  // restore the timeslider to the point where it was:
  slider._timeSlider.value = currentlyDisplayedDate;
  slider.setTime(currentlyDisplayedDate);

  // toggle the decade legend:
  if (legendOpen) {
    if (displayType === "decade") {
      document.getElementById("legendSize").style.display="block";
    } else {
      document.getElementById("legendSize").style.display="none";
    }
  }
}

function togglePanel() {
  // open or close the side panel

  if (sidepanelOpen) {
    closePanel();
    sidepanelOpen = false;
  } else {
    openPanel();
    sidepanelOpen = true;
  }
}

function openPanel() {
  /* open the sidepanel
  */
  var mapBounds = map.getBounds();
  //console.log(mapBounds);

  // set the width of all the relevant divs:
  document.getElementById("infosidepanel").style.width="30vw";
  document.getElementById("yearDecadeRadios").style.left="calc(30vw + 50px)";
  document.getElementById("active-mints").style.width="30vw";
  document.getElementById("mintInfo").style.width="30vw";
  document.getElementById("mintInfo1").style.width="8vw";
  document.getElementById("mintInfo2").style.width="8vw";
  document.getElementById("mintInfo2").style.left="10vw";
  document.getElementById("mintInfo3").style.width="8vw";
  document.getElementById("mintInfo3").style.left="20vw";
  document.getElementById("authorityInfo").style.width="30vw";
  document.getElementById("authorityInfo1").style.width="8vw";
  document.getElementById("authorityInfo2").style.width="8vw";
  document.getElementById("authorityInfo2").style.left="10vw";
  document.getElementById("authorityInfo3").style.width="8vw";
  document.getElementById("authorityInfo3").style.left="20vw";
  document.getElementById("map").style.marginLeft="30vw";
  document.getElementById("map").style.width="70vw";
  document.getElementById("sidepanelButton").style.marginLeft="30vw";
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.padding="1em");
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.overflow="auto");
  document.querySelectorAll(".modal-trigger").forEach(element => element.style.left="calc(30vw + 50px)");

  //// attempts to get the map to resize so that all features in the previous mapview are visible in the new one; does not work yet!
  //console.log(map.getCenter());
  //map.setView(new L.LatLng(34, (0.7*35)), 4);
  //console.log(map.getCenter());
  //setTimeout(function(){ map.invalidateSize()}, 600);
  //map.fitBounds(mapBounds);
  //console.log(map.getBounds());
}

function closePanel() {
/* open the sidepanel
*/
  var mapBounds = map.getBounds();
  //console.log(mapBounds);

  // set the width of all the relevant divs:
  document.getElementById("infosidepanel").style.width="0";
  document.getElementById("yearDecadeRadios").style.left="50px";
  document.getElementById("active-mints").style.width="0";
  document.getElementById("mintInfo").style.width="0";
  document.getElementById("mintInfo1").style.width="0";
  document.getElementById("mintInfo2").style.width="0";
  document.getElementById("mintInfo2").style.left="0";
  document.getElementById("mintInfo3").style.width="0";
  document.getElementById("mintInfo3").style.left="0";
  document.getElementById("authorityInfo").style.width="0";
  document.getElementById("authorityInfo1").style.width="0";
  document.getElementById("authorityInfo2").style.width="0";
  document.getElementById("authorityInfo2").style.left="0";
  document.getElementById("authorityInfo3").style.width="0";
  document.getElementById("authorityInfo3").style.left="0";
  document.getElementById("map").style.marginLeft="0";
  document.getElementById("map").style.width="100vw";
  document.getElementById("sidepanelButton").style.marginLeft="0";
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.padding="0");
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.overflow="hidden");
  document.querySelectorAll(".modal-trigger").forEach(element => element.style.left="50px");

  //// attempts to get the map to resize so that all features in the previous mapview are visible in the new one; does not work yet!
  //console.log(map.getCenter());
  //map.setView(new L.LatLng(34, 35), 4);
  //setTimeout(function(){ map.invalidateSize()}, 600);
  //map.fitBounds(mapBounds);
  //console.log(map.getBounds());
}

function toggleLegend() {
  // open or close the legend panel

  if (legendOpen) {
    document.getElementById("legendClosed").style.display="block";
    document.getElementById("legendOpened").style.display="none";
    legendOpen = false;
  } else {
    document.getElementById("legendClosed").style.display="none";
    document.getElementById("legendOpened").style.display="block";
    legendOpen = true;
    if (displayType === "decade") {
      document.getElementById("legendSize").style.display="block";
    } else {
      document.getElementById("legendSize").style.display="none";
    }
  }
}



function defineCircleSegment(checkboxCount, metal) {
  /*return the relevant circle segment path for each metal (AU, AR, AE):
  */
  if (metal == "AU"){
     return circle_3L_pth;
  } else if (metal == "AR"){
     return circle_3R_pth;
  } else if (metal == "AE"){
    return circle_3B_pth;
  }
}

/*      function makeCircleTimeline(geoJ){
// wrapper for the L.timeline function, using L.CircleMarker;
// turn a geoJson file into a leaflet timeline with specified markers
// NB: for now, this function is not called ; all timelines are made only once
  return L.timeline(
     geoJ,
     {
        onEachFeature: mintPopUp,
        pointToLayer: function(feature, latlng) {
           return L.circleMarker (
              latlng,
              {
                 radius: feature.properties.marker_size * 1.5,
                 color: feature.properties.marker_colour,
                 fillColor: feature.properties.marker_colour,
                 fillOpacity: 0.6
              }
           );
        }
     }
  );
}
*/

function makeThirdCircleTimeline(geoJ){
/* wrapper for the L.timeline function, using L.DivIcon;
   turn a geoJson file into a leaflet timeline with specified markers
   (i.c., thirds of circles, each third representing a specific metal (AU, AR, AE),
   and the sizes representing the numbers of years the mint is producing this material in the time period)
PROBLEMS:
* markers consist of two parts: a white square (the standard divIcon marker)
  and the circle segment. The white square changes size,
  the circle segment changes colour but not size
  * circle segments do not change size:
    SOLVED: by introducing a g element in the svg code, with a scale transformation
  * I managed to make the circle segments fit within the white boxes,
    but the scaling happens from the upper left corner, so that different circle segments
    with different scalings do not fit together yet.
    SOLVED: using the iconAnchor property of the divIcon does seem to set the center point of the scaling
  * Supposedly ,the white boxes should disappear when the class of the divIcon is set to
    another value than the standard value, but that does not seem to work here
    SOLVED: works by setting className (not classname!) in the divIcon settings to a non-standard value (here: used "circleSegment")
  * The size of the white boxes can be set by using the iconSize property of the divIcon;
    however, setting it to 0 does not remove it entirely
    SOLVED: setting className (not classname!) in the divIcon settings to a non-standard value (here: used "circleSegment") removes the small remaining dot
* A small part of the circle segments seems to be cut off
  SOLVED: by setting stroke-width in the svg to 0.
*/
  var iconHTML = `
                     <svg xmlns="http://www.w3.org/2000/svg">
                         <circle cx="20" cy="20" r="20" fill="{fill_color}" stroke="{stroke_color}" stroke-width="0" opacity="0.5" />
                    </svg>
                  `;
  var iconSettings = {
     // the iconSettings object contains the settings to be introduced into the iconHTML svg
     fill_color : "blue",
     stroke_color: "blue",
     icon_size : 40,
     half_icon_size : 20,
  };
  return L.timeline(
     geoJ,
     {
        onEachFeature: mintPopUp,
        pointToLayer: function(feature, latlng) {
           iconSettings.icon_size = 10*(Math.sqrt(feature.properties.marker_size)); // using square root reduces the difference in size between mints that minted only once a decade and those that mint every year.
           iconSettings.fill_color = feature.properties.marker_colour;
           //console.log(iconSettings.fill_color + icon_size);
           iconSettings.stroke_color = feature.properties.marker_colour;
           //iconSettings.circle_pth = defineCircleSegment(checkboxCount, feature.properties.metal);
           var divIcon = L.divIcon(
              {
                 className: "circleSegment",
                 html: L.Util.template(iconHTML, iconSettings),
                 iconSize: null, // setting this to null creates a large white box;
                 iconAnchor: [(iconSettings.icon_size/2),(iconSettings.icon_size/2)],
                 popupAnchor: [0, -iconSettings.icon_size/2]
              }
           );
           return L.marker(latlng, {icon: divIcon});
        }
     }
  );
}

function mintPopUp (feature, layer) {
  /* bind a popup to a feature
  */
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(feature.properties.descr);
        }
    }


function displayAU() {
  /* display the dinar mints on the map if the AU_checkbox is checked
  * (called from the AU checkbox in the info pane)
  */
  var auCheckbox = document.getElementById("AU_checkbox");
  if (auCheckbox.checked){
     /*// change shape of the markers depending on the number of metals displayed: (NOT IMPLEMENTED)
     if (checkboxCount === 1){
       AU_mintTimeline1.addTo(map);
     } else if (checkboxCount > 1){
       AU_mintTimeline3.addTo(map);
     }*/
    AU_mintTimeline3.addTo(map);
    checkboxCount++;
  }
  else {
    AU_mintTimeline3.removeFrom(map);
    /*// change shape of the markers depending on the number of metals displayed: (NOT IMPLEMENTED)
    AU_mintTimeline1.removeFrom(map);*/
    checkboxCount--;
  }
  //console.log(checkboxCount);
}

function displayAR() {
  /* display the dirham mints on the map if the AR_checkbox is checked
  * (called from the AR checkbox in the info pane)
  */
  var arCheckbox = document.getElementById("AR_checkbox");
  if (arCheckbox.checked){
     /*// change shape of the markers depending on the number of metals displayed: (NOT IMPLEMENTED)
     if (checkboxCount === 1){
       AR_mintTimeline1.addTo(map);
     } else if (checkboxCount > 1){
       AR_mintTimeline3.addTo(map);
     }          */
     AR_mintTimeline3.addTo(map);
     checkboxCount++;
    }
  else {
    AR_mintTimeline3.removeFrom(map);
    /*// change shape of the markers depending on the number of metals displayed: (NOT IMPLEMENTED)
    AR_mintTimeline1.removeFrom(map);*/
    checkboxCount--;
  }
  //console.log(checkboxCount);
}

function displayAE() {
  /* display the fulus mints on the map if the AE_checkbox is checked
  * (called from the AE checkbox in the info pane)
  */
  var aeCheckbox = document.getElementById("AE_checkbox");
  if (aeCheckbox.checked){
     /*// change shape of the markers depending on the number of metals displayed: (NOT IMPLEMENTED)
     if (checkboxCount === 1){
       AE_mintTimeline1.addTo(map);
     } else if (checkboxCount > 1){
       AE_mintTimeline3.addTo(map);
     }          */
     AE_mintTimeline3.addTo(map);
     checkboxCount++;
    }
  else {
    AE_mintTimeline3.removeFrom(map);
    /*// change shape of the markers depending on the number of metals displayed: (NOT IMPLEMENTED)
    AE_mintTimeline1.removeFrom(map);*/
    checkboxCount--;
  }
}

function updateList(timeline, mintListName, metalMintCount, authListName, metalAuthList, metalAuthCount){
  /* update the list of active mints and mint authorities in the left pane of the window
  */
  var displ_timeframe = document.getElementById('displayed-timeframe');
  var metal_mint_count = document.getElementById(metalMintCount);
  var mintList = document.getElementById(mintListName);
  var authList = document.getElementById(authListName);
  metalAuthList = []; // empty the current list of minting authorities
  mintList.innerHTML = "";
  authList.innerHTML = "";
  var displayed = timeline.getLayers();

  // sort the place names alphabetically (see https://stackoverflow.com/a/979289):
  displayed.sort((current,next)=>{ return current.feature.properties.name.localeCompare(next.feature.properties.name)});

  displayed.forEach(function(el){
    var li = document.createElement('li');
    if (el.feature.properties.name) {
      // add an item to the list of active mints for each active mint in the displayed decade:
      // (preceded with a dot colored after its minting authority; and a mouseover link to the relevant popup
      var colorDot = '<span class="dot" style="background-color: '+el.feature.properties.marker_colour+'" title="'+el.feature.properties.dynasty+'"></span>';
      li.innerHTML = colorDot + '<span id="' + el.feature.properties.id + '" onmouseover="openMarkerPopup(this.id)">' + el.feature.properties.name + '</span>';
      mintList.appendChild(li);

      // add the minting authority of the current mint to the list of active mints if it is not already in there:
      if (el.feature.properties.dynasty){
        var auth = [el.feature.properties.dynasty, el.feature.properties.marker_colour];
        //if (! (metalAuthList.includes(auth))){ // does not work with nested arrays!
        if (! (metalAuthList.find(el => el[0] === auth[0] && el[1] === auth[1]))){
          //console.log(auth, " not in ", metalAuthList);
          metalAuthList.push(auth);
        }
      }
    }
    // display the current timeframe in the title of the info pane:
    if (displayType === "decade") {
       displ_timeframe.innerHTML = el.feature.properties.decade + "s AH) <br/>(" + el.feature.properties.start + " - " + el.feature.properties.end + " CE";
    } else if (displayType === "year") {
       displ_timeframe.innerHTML = el.feature.properties.dates + " AH) <br/>(" + el.feature.properties.start + " - " + el.feature.properties.end + " CE";
    }
  });

  //add the number of active mints between the brackets of the relevant metal:
  metal_mint_count.innerHTML = displayed.length;

  // sort list of the active mint authorities and add them to the relevant ul:
  metalAuthList.sort((current,next)=>{ return current[0].localeCompare(next[0])});
  for (var i=0; i<metalAuthList.length; i++){
    var colorDot = '<span class="dot" style="background-color: '+metalAuthList[i][1]+'"></span>';
    var li = document.createElement('li');
    li.innerHTML = colorDot + "<span>" + metalAuthList[i][0] + "</span>";
    authList.appendChild(li);
  }

  // add the number of active minting authorities to the relevant metal
  var metalAuthoritiesCount = document.getElementById(metalAuthCount);
  metalAuthoritiesCount.innerHTML = (metalAuthList.length);
}


function openMarkerPopup(id){
/*open the popup of the relevant mint (id) (called from the info pane)
* see https://stackoverflow.com/questions/31237459/how-to-open-leaflet-marker-popup-from-data-geojson-with-href
*/
  //var id = this.id;
  console.log(id);
  var geojsons = [AU_mintTimeline3, AR_mintTimeline3, AE_mintTimeline3];
  for (var i=0; i<3; i++){
    geojsons[i].eachLayer(function(feature){
      if(feature.feature.properties.id==id){
        feature.openPopup();
      }
    });
  }
}

// SET BASE MAP LAYERS (see overview at https://leaflet-extras.github.io/leaflet-providers/preview/):

var acwUrl = 'https://api.tiles.mapbox.com/v4/isawnyu.map-knmctlkh/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiaXNhd255dSIsImEiOiJBWEh1dUZZIn0.SiiexWxHHESIegSmW8wedQ';
var acwAttrib = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
var acw = L.tileLayer(acwUrl, {
  maxZoom: 18,
  attribution: acwAttrib,
  noWrap: true
});
var Hydda_Base = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  maxZoom: 16
});
var Esri_WorldTerrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
  maxZoom: 13
});

// CREATE THE MAP:

var map = L.map('map', {
  layers: [Esri_WorldTerrain],
  center: new L.LatLng(34,52),
  zoom: 4,
  maxBounds: [[90,-180], [-90, 180]]
});
//map.fitBounds([[55.62799595426723,91.845703125], [5.178482088522876, -21.972656250000]]);


// CREATE THE TIMELINE SLIDER AND ADD IT TO THE MAP:

var slider = L.timelineSliderControl({
  enableKeyboardControls: true,
  duration: 400000,
  formatOutput: function(date){
    return moment(date).format("YYYY");
  }
});
map.addControl(slider);

function createTimelines(){
// CREATE THE TIMELINES:

  if (displayType === "decade") {
     AU_mintTimeline3 = makeThirdCircleTimeline(AU_mints); // do not declare var: change global AU_mintTimeline3 variable rather than making new local variable!
     AR_mintTimeline3 = makeThirdCircleTimeline(AR_mints);
     AE_mintTimeline3 = makeThirdCircleTimeline(AE_mints);
  }
  else if (displayType === "year") {
     AU_mintTimeline3 = makeThirdCircleTimeline(AU_mints_year);
     AR_mintTimeline3 = makeThirdCircleTimeline(AR_mints_year);
     AE_mintTimeline3 = makeThirdCircleTimeline(AE_mints_year);
  }

// ADD THE TIMELINES TO THE MAP:
  AU_mintTimeline3.addTo(map);
  AR_mintTimeline3.addTo(map);
  AE_mintTimeline3.addTo(map);

  /*// different shape of markers depending on the number of metals displayed: (NOT IMPLEMENTED)
  var AU_mintTimeline1 = makeCircleTimeline(AU_mints);
  var AR_mintTimeline1 = makeCircleTimeline(AR_mints);
  var AE_mintTimeline1 = makeCircleTimeline(AE_mints);
  if (checkboxCount === 1){
     AU_mintTimeline1.addTo(map);
     AR_mintTimeline1.addTo(map);
     AE_mintTimeline1.addTo(map);
  } else if (checkboxCount > 1){
     AU_mintTimeline3.addTo(map);
     AR_mintTimeline3.addTo(map);
     AE_mintTimeline3.addTo(map);
  }*/

// CREATE EVENT LISTENERS FOR EACH TIMELINE TO UPDATE THE INFO PANE:

  AU_mintTimeline3.on('change', function(e){
    if (document.getElementById("AU_checkbox").checked) {
        updateList(e.target, "auMintInfo", "AU-mint-count", "auAuthorityInfo", auAuthorities, "auAuthoritiesCount");
      } else {
        document.getElementById("auMintInfo").innerHTML = ""
      }
    });

  AR_mintTimeline3.on('change', function(e){
    if (document.getElementById("AR_checkbox").checked) {
        updateList(e.target, "arMintInfo", "AR-mint-count", "arAuthorityInfo", arAuthorities, "arAuthoritiesCount");
      } else {
        document.getElementById("arMintInfo").innerHTML = ""
      }
    });

  AE_mintTimeline3.on('change', function(e){
    if (document.getElementById("AE_checkbox").checked) {
        updateList(e.target, "aeMintInfo", "AE-mint-count", "aeAuthorityInfo", aeAuthorities, "aeAuthoritiesCount");
      } else {
        document.getElementById("aeMintInfo").innerHTML = ""
      }
   });


 // FINALLY, ADD THE TIMELINES TO THE SLIDER:

   slider.addTimelines(AU_mintTimeline3, AR_mintTimeline3, AE_mintTimeline3);
   return [AU_mintTimeline3, AR_mintTimeline3, AE_mintTimeline3]
 }

 var timeLines = createTimelines();
 var AU_mintTimeline3 = timeLines[0];
 var AR_mintTimeline3 = timeLines[1];
 var AE_mintTimeline3 = timeLines[2];


 //Show or hide the info modal:

 var modal = document.querySelector(".modal");
 var trigger = document.querySelector(".modal-trigger");
 var closeButton = document.querySelector(".close-button");

 function toggleModal() {
     modal.classList.toggle("show-modal");
 }

 function windowOnClick(event) {
     if (event.target === modal) {
         toggleModal();
     }
 }

 trigger.addEventListener("click", toggleModal);
 closeButton.addEventListener("click", toggleModal);
 window.addEventListener("click", windowOnClick);

 toggleModal()
