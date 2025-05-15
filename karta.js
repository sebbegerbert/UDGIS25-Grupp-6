let map, view, graphicsLayer, busLayer, markers, positions, current, busInterval
//const json_och_iconer = ["badplatser", "idrott_motion", "lekplatser", "livraddningsutrustning", "offentliga_toaletter", "papperskorgar", "parkmobler", "pulkabackar", "Rastplatser", "spontanidrott", "utegym"]

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/geometry/Polyline",
  "esri/symbols/PictureMarkerSymbol",
  "esri/PopupTemplate"
  
], function(Map, MapView, GraphicsLayer, Graphic, Point, Polyline, PictureMarkerSymbol, PopupTemplate) {

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
  map.add(stopsLayer);
  //getPoints(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);


  const categories = {
    barnvanliga : ["lekplatser", "pulkabackar"],
    motion : ["utegym", "motionsspar", "idrott_motion", "spontanidrott"],
    natur : ["badplatser", "rastplatser", "parkmobler"],
    service : ["offentliga_toaletter", "papperskorgar"],
    trygghet : ["livraddningsutrustning"]
  };

  async function fetchData(file) {
    const response = await fetch(file);
    return response.json();
  }

  function getPoints(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList) {
    fileList.forEach(fileName =>  {
      var json_file = ("JSON/" + fileName + ".json")

      fetchData(json_file).then(data => {
        showPoints(data, stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);
      });
    });
  }

  function showPoints(data, stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate) {
    data.features.forEach(feature => {

      const geomType = feature.geometry.type;
      const coord = feature.geometry.coordinates;

      let geometry;
      let symbol;

      if (geomType === "Point") {
        geometry = {
          type: "point",
          longitude: coord[0],
          latitude: coord[1]
        };
        symbol = {
          type: "simple-marker",
          color: "pink",
          size: 8
        };
      } else if (geomType === "LineString") {
        geometry = {
          type: "polyline",
          paths: [coord]
        };
        symbol = {
          type: "simple-line",
          color: "red",
          width: 2
        };
      } else {
        console.warn("Unsupported geometry type:", geomType)
      }

      var graphic = new Graphic({
        geometry: geometry,
        symbol: symbol,
        attributes: feature.properties,
        popupTemplate: {
          title: "{NAMN}",
          content: "{BESKR_KORT}"
        }
      });

      stopsLayer.add(graphic);
    });
  };

  function initButtons(point) {
    const buttons = document.querySelectorAll(".paneButton");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const categoryName = button.name;
        const fileList = categories[categoryName];
      
        getPoints(stopsLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList);
      });
    });
  }

  initButtons();
});