let map, view, graphicsLayer, busLayer, markers, positions, current, busInterval
const json_och_iconer = ["badplatser", "idrott_motion", "lekplatser", "livraddningsutrustning", "offentliga_toaletter", "papperskorgar", "parkmobler", "pulkabackar", "Rastplatser", "spontanidrott", "utegym"]

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/symbols/PictureMarkerSymbol",
  "esri/PopupTemplate"
], function(Map, MapView, GraphicsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate) {

  map = new Map({
    basemap: "streets"
  });
  view = new MapView({
    container: "mapDiv",
    map: map,
    center: [17.151189, 60.676245],
    zoom: 12,
    sliderStyle: "small"
  });

  var stopsLayer = new GraphicsLayer();
  getStopsData(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);
});

const barnvanliga = ["lekplatser", "pulkabackar"];
const motion = ["utegym", "motionsspar", "idrott_motion", "spontanidrott"];
const natur = ["badplatser", "rastplatser", "parkmobler"];
const service = ["offentliga_toaletter", "papperskorgar"];
const trygghet = ["livraddningsutrustning"];

async function fetchData(file) {
  const response = await fetch(file);
  return response.json();
}

function getStopsData(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate) {
  for (let i = 0; i < json_och_iconer.length; i++) {
    var json_file = ("JSON/" + json_och_iconer[i] + ".json")

    fetchData(json_file).then(data => {
      showStops(data, stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);
    });
  }

  function showStops(data, stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate) {
    map.add(stopsLayer);
    data.features.forEach(features => {

      const coord = features.geometry.coordinates;
      var name = features.properties.NAMN;
      var beskrivning = features.properties.BESKR_KORT;

      var point = new Point({
        longitude: coord[0],
        latitude: coord[1],
      });

      var graphic = new Graphic({
        geometry: point,
        symbol: {
          type: "simple-marker",
          color: "pink",
          size: 8,
        }
      });

      var popupTemplate = new PopupTemplate({
        title: name,
        content: beskrivning
      });
      graphic.popupTemplate = popupTemplate;
      stopsLayer.add(graphic);

    });

  };
}


function showBarnvanliga_aktiviteter() {

}

function showMotion_traning() {

}

function showNatur_rekreation() {

}

function showServicefunktioner() {

}

function showTrygghet() {

}

function initButtons(point) {
  const buttons = document.querySelectorAll(".paneButton");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const fileName = button.name + ".json";
      const filePath = "data/" + fileName;
      showPoints(filePath);
    });
  });
}
