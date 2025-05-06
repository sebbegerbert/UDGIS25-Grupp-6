let map, view, graphicsLayer, busLayer, markers, positions, current, busInterval
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
});
