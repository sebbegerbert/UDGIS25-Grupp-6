let map, view, graphicsLayer, busLayer, markers, positions, current, busInterval
const json_och_iconer = ["badplatser", "idrott_motion", "lekplatser"]
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
  busLayer = new GraphicsLayer();
  positions = [];
  markers = [];
  getStopsData(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);
  /*getBusData();
  makeBusMarkers(stopsLayer, Graphic, Point, PictureMarkerSymbol);
  initButtons(Point);
  map.add(busLayer);*/
});

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

    data.features.forEach(features => {

      const coord = features.geometry.coordinates;
      const name = features.properties.namn;

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
        },

      });
      stopsLayer.add(graphic);
      map.add(stopsLayer);
      /* var popupTemplate = new PopupTemplate({
         title: "Busshållsplats",
         content: name
       });
       graphic.popupTemplate = popupTemplate;
       stopsLayer.add(graphic);
   
     });*/


    });
  }
}
