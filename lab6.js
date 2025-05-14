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

  var stopsLayer = new GraphicsLayer();
  busLayer = new GraphicsLayer();
  positions = [];
  markers = [];
  getStopsData(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);
  getBusData();
  makeBusMarkers(stopsLayer, Graphic, Point, PictureMarkerSymbol);
  initButtons(Point);
  map.add(busLayer);
});

async function fetchData(file) {
  const response = await fetch(file);
  return response.json();
}

function getStopsData(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate) {
  fetchData("http://www.student.hig.se/~24anta04/DS/lab6/points.json").then(data => {
    showStops(data, stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);
  });
}


function getBusData(stopsLayer, Graphic, Point, PictureMarkerSymbol) {
  fetchData("http://www.student.hig.se/~24anta04/DS/lab6/gdata.json").then(data => {
    setBusPositions(data);
  });
}

function showStops(data, stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate) {
  map.add(stopsLayer);

  data.stations.forEach(stations => {

    const symbol = new PictureMarkerSymbol("http://www.student.hig.se/~24anta04/DS/lab6/xx.png");
    const x = stations.x;
    const y = stations.y;
    const name = stations.name;

    var point = new Point({
      longitude: x,
      latitude: y,
    });

    var graphic = new Graphic({
      geometry: point,
      symbol: symbol,

    });
    var popupTemplate = new PopupTemplate({
      title: "Busshållsplats",
      content: name
    });
    graphic.popupTemplate = popupTemplate;
    stopsLayer.add(graphic);

  });
};

function setBusPositions(data) {
  for (let i = 0; i < 4; i++) {
    positions[i] = [];
  };
  data.gdata.forEach(gdata => {
    const lineIndex = (gdata.line - 1);
    positions[lineIndex].push([gdata.lat, gdata.long]);
  });
};

function makeBusMarkers(stopsLayer, Graphic, Point, PictureMarkerSymbol) {
  const iconUrls = [1, 2, 3, 4].map(num => `line${num}.png`);
  markers = iconUrls.map((icon, index) => {
    var point = new Point({
      longitude: 0,
      latitude: 0
    });
    var markerSymbol = new PictureMarkerSymbol({
      url: `http://www.student.hig.se/~24anta04/DS/lab6/${icon}`,
      height: "40px",
      width: "40px"
    });
    var marker = new Graphic({
      geometry: point,
      symbol: markerSymbol,
      visibility: true
    });
    busLayer.add(marker);

    return marker;

  });
};

function initButtons(Point) {
  const buttons = document.querySelectorAll(".paneButton");

  buttons.forEach(button => {
    button.addEventListener("click", () => clearInterval(busInterval));
    button.addEventListener("click", () => showBus(button.name - 1, Point));

  });

};

function showBus(line, Point) {
  const lineIndex = line;

  busLayer.removeAll()

  busLayer.add(markers[lineIndex]);
  current = positions[lineIndex].length - 1;

  busInterval = setInterval(() => {
    if (current >= 0) {
      const pos = positions[lineIndex][current];

      var point = new Point({
        longitude: pos[0],
        latitude: pos[1]
      });

      markers[lineIndex].geometry = point;
      current--;

    } else {
      clearInterval(busInterval);
    }
  }, 300);
};
