var checkboxCount = 3;  // number of checkboxes (AU, AR, AE) checked
var auAuthorities = []; // will hold a list of active minting authorities during the displayed timeframe
var arAuthorities = [];
var aeAuthorities = [];
var activeDecade = "";  // the decade currently displayed in the timeline
var sidepanelOpen = false; // to track whether the sidepanel is open or not
var legendOpen = false;
var layerControlOpen = false;
var displayType = "year"; // display types: year (active mints per year) and decade (active mints per decade)

/* svg paths for the circle thirds (3L = the left third, 3R = the right third, 3B = the bottom third):*/
var auStyle = {
    radius: 18,
    fillColor: "#FFD700",
    color: "#FFD700",
    weight: 1,
    opacity: 1,
    fillOpacity: 1,
};

var arStyle = {
    radius: 12,
    fillColor: "#C0C0C0",
    color: "#C0C0C0",
    weight: 1,
    opacity: 1,
    fillOpacity: 1,
};

var aeStyle = {
    radius: 6,
    fillColor: "#b87333",
    color: "#b87333",
    weight: 1,
    opacity: 1,
    fillOpacity: 1,
};

var authoritiesStyle = {
    radius: 12,
    fillColor: "#fff",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.5,
};

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
  var mapBounds = map.getBounds();

  document.getElementById("infosidepanel").style.width="30vw";
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
  document.getElementById("menu").style.marginLeft="30vw";
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.padding="1em");
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.overflow="auto");
  document.querySelectorAll(".modal-trigger").forEach(element => element.style.marginLeft="30vw");
  document.querySelectorAll(".legend").forEach(element => element.style.marginLeft="30vw");
  document.querySelectorAll(".layer-control-dropdown").forEach(element => element.style.marginLeft="30vw");
}

function closePanel() {
  var mapBounds = map.getBounds();

  document.getElementById("infosidepanel").style.width="0";
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
  document.getElementById("menu").style.marginLeft="0";
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.padding="0");
  document.querySelectorAll(".sidepanelDiv").forEach(element => element.style.overflow="hidden");
  document.querySelectorAll(".modal-trigger").forEach(element => element.style.marginLeft="0");
  document.querySelectorAll(".legend").forEach(element => element.style.marginLeft="0");
  document.querySelectorAll(".layer-control-dropdown").forEach(element => element.style.marginLeft="0");
}

/* Open */
function openNav() {
document.getElementById("myNav").style.width = "20%";
}

/* Close */
function closeNav() {
document.getElementById("myNav").style.width = "0%";
}

/* Open About */
function openAbout() {
  document.getElementsByClassName("overlay-content")[0].style.transform = "translateX(-20vw)";
  document.getElementById("aboutPane").style.transform = "translateX(-20vw)";
}

/* Close About */
function closeAbout() {
document.getElementsByClassName("overlay-content")[0].style.transform = "translateX(0vw)";
document.getElementById("aboutPane").style.transform = "translate(0vw)";
}

/* Open Mental Maps div */
function openMMDiv() {
  document.getElementsByClassName("admin-maps-menu")[0].style.width = "0vw";
  document.getElementsByClassName("mental-maps-menu")[0].style.width = "150px";
}

function closeMMDiv() {
  document.getElementsByClassName("mental-maps-menu")[0].style.width = "0vw";
}

/* Open Admin Maps div */
function openAMDiv() {
  document.getElementsByClassName("mental-maps-menu")[0].style.width = "0vw";
  document.getElementsByClassName("admin-maps-menu")[0].style.width = "150px";
}

function closeAMDiv() {
  document.getElementsByClassName("admin-maps-menu")[0].style.width = "0vw";
}

/* Close all menus */
function closeMenuDivs() {
  document.getElementsByClassName("mental-maps-menu")[0].style.width = "0vw";
  document.getElementsByClassName("admin-maps-menu")[0].style.width = "0vw";
}

function toggleLegend() {

  if (legendOpen) {
    document.getElementById("legendClosed").style.display="block";
    document.getElementById("legendOpened").style.display="none";
    legendOpen = false;
  } else {
    document.getElementById("legendClosed").style.display="none";
    document.getElementById("legendOpened").style.display="block";
    legendOpen = true;
  }
}

function toggleLayerControl() {

  if (layerControlOpen) {
    document.getElementById("layerControlClosed").style.display="block";
    document.getElementById("layerControlOpened").style.display="none";
    layerControlOpen = false;
  } else {
    document.getElementById("layerControlClosed").style.display="none";
    document.getElementById("layerControlOpened").style.display="block";
    layerControlOpen = true;
  }
}

function defineCircleStyle(checkboxCount, metal) {
  if (metal == "AU"){
     return auStyle;
  } else if (metal == "AR"){
     return arStyle;
  } else if (metal == "AE"){
    return aeStyle;
  }
}

function makeCircleTimeline(geoJ){

  var iconSettings = {
     icon_style: auStyle,
  };

  return L.timeline(
     geoJ,
     {
        onEachFeature: mintPopUp,
        pointToLayer: function(feature, latlng) {
          var mintsOrAuthorities = document.querySelector('input[name="mintsOrAuthorities"]:checked').value;
          if (mintsOrAuthorities == "mints") {
          switch(feature.properties.metal) {
            case "AE":
              iconSettings.icon_style = aeStyle;
              break;
            case "AR":
              iconSettings.icon_style = arStyle;
              break;
            case "AU":
              iconSettings.icon_style = auStyle;
              break;
            default:
              iconSettings.icon_style = aeStyle;
          }
        } else {
          iconSettings.icon_style = authoritiesStyle;
          authoritiesStyle.fillColor = feature.properties.marker_colour;
        }
           var divIcon = L.divIcon({ className: "circleSegment" });
           return L.circleMarker(latlng, iconSettings.icon_style);
        }
     }
  );
}

// Add popup functionality

function mintPopUp (feature, layer) {
  if (feature.properties && feature.properties.name) {
    layer.bindPopup(feature.properties.descr);
		layer.on('mouseover', function(event) {
			layer.openPopup();
		});
		layer.on('mouseout', function(event) {
			layer.closePopup();
		});
      }
  };


function displayAU() {
  var auCheckbox = document.getElementById("AU_checkbox");
  if (auCheckbox.checked){
    AU_mintTimeline3.addTo(map);
    checkboxCount++;
  }
  else {
    AU_mintTimeline3.removeFrom(map);
    checkboxCount--;
  }
}

function displayAR() {
  var arCheckbox = document.getElementById("AR_checkbox");
  if (arCheckbox.checked){
     AR_mintTimeline3.addTo(map);
     checkboxCount++;
    }
  else {
    AR_mintTimeline3.removeFrom(map);
    checkboxCount--;
  }
}

function displayAE() {
  var aeCheckbox = document.getElementById("AE_checkbox");
  if (aeCheckbox.checked){
     AE_mintTimeline3.addTo(map);
     checkboxCount++;
    }
  else {
    AE_mintTimeline3.removeFrom(map);
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
      li.innerHTML = colorDot + '<span id="' + el.feature.properties.id + '" onmouseover="openMarkerPopup(this.id)"> ' + el.feature.properties.name + '</span>';
      mintList.appendChild(li);

      // add the minting authority of the current mint to the list of active mints if it is not already in there:
      if (el.feature.properties.dynasty){
        var auth = [el.feature.properties.dynasty, el.feature.properties.marker_colour];
        if (! (metalAuthList.find(el => el[0] === auth[0] && el[1] === auth[1]))){
          metalAuthList.push(auth);
        }
      }
    }
  });

  metal_mint_count.innerHTML = displayed.length;

  metalAuthList.sort((current,next)=>{ return current[0].localeCompare(next[0])});
  for (var i=0; i<metalAuthList.length; i++){
    var colorDot = '<span class="dot" style="background-color: '+metalAuthList[i][1]+'"></span>';
    var li = document.createElement('li');
    li.innerHTML = colorDot + "<span>" + metalAuthList[i][0] + "</span>";
    authList.appendChild(li);
  }

  var metalAuthoritiesCount = document.getElementById(metalAuthCount);
  metalAuthoritiesCount.innerHTML = (metalAuthList.length);
}


function openMarkerPopup(id){
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

// CREATE THE MAP:

var mapboxBandW = L.tileLayer('https://{s}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-bathy-jul-bw/{z}/{x}/{y}.png', {
  attribution: 'Tiles &copy; Mapbox &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
  maxZoom: 13
});

var map = L.map('map', {
  layers: [mapboxBandW],
  center: new L.LatLng(34,52),
  zoom: 4,
  maxBounds: [[90,-180], [-90, 180]]
});

// CREATE THE TIMELINE SLIDER AND ADD IT TO THE MAP:

var slider = L.timelineSliderControl({
  enableKeyboardControls: true,
  duration: 200000,
  formatOutput: function(date){
    return moment(date).format("YYYY");
  }
});
map.addControl(slider);

function createTimelines(){
// CREATE THE TIMELINES:

AU_mintTimeline3 = makeCircleTimeline(AU_mints_year);
AR_mintTimeline3 = makeCircleTimeline(AR_mints_year);
AE_mintTimeline3 = makeCircleTimeline(AE_mints_year);

// ADD THE TIMELINES TO THE MAP:
  AU_mintTimeline3.addTo(map);
  AR_mintTimeline3.addTo(map);
  AE_mintTimeline3.addTo(map);

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

 toggleModal();
