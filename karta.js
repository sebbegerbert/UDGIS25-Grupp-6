let map, view, graphicsLayer, busLayer, markers, positions, current, busInterval

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

  //Kategorier med filnamn utan filändelse 
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

  //Får filnamn (utan filändelse) i form av en lista och skickar det med rätt filändelse till showPoints
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

      //Kollar vilken geometry type det är och ger punkter och linjer symboler. 
      //Borde kanske vara en egen funktion för att göra det lättare sen med polygon. Inget viktigt
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

      //Ritar geometrier och lägger till popup ruta
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

  //Med hjälp av knapp namn väljs kategori och skickas till getPoints
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