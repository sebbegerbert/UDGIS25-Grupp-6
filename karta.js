let map, view, graphicsLayer, sparFilName

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/geometry/Polyline",
  "esri/symbols/PictureMarkerSymbol",
  "esri/PopupTemplate",
  "esri/geometry/support/webMercatorUtils",
  "esri/geometry/Polygon",

], function(Map, MapView, GraphicsLayer, Graphic, Point, Polyline, PictureMarkerSymbol, PopupTemplate, webMercatorUtils, Polygon) {

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

  var poiLayer = new GraphicsLayer();
  var barnvanligaLayer = new GraphicsLayer();
  var motionLayer = new GraphicsLayer();
  var naturLayer = new GraphicsLayer();
  var serviceLayer = new GraphicsLayer();
  var trygghetLayer = new GraphicsLayer();
  var userLayer = new GraphicsLayer();





  //Kategorier med filnamn utan filändelse 
  const categories = {
    barnvanliga: ["lekplatser", "pulkabackar"],
    motion: ["utegym", "motionsspar", "idrott_motion", "spontanidrott"],
    natur: ["badplatser", "rastplatser", "parkmobler"],
    service: ["offentliga_toaletter", "papperskorgar"],
    trygghet: ["livraddningsutrustning"]
  };

  async function fetchData(file) {
    const response = await fetch(file);
    return response.json();
  }

  //Får filnamn (utan filändelse) i form av en lista och skickar det med rätt filändelse till showPoints
  function getPoints(poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList) {

    fileList.forEach(fileName => {
      var json_file = ("JSON/" + fileName + ".json")

      fetchData(json_file).then(data => {
        showPoints(data, poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate);
      });
    });
  }

  function showPoints(data, poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate) {
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
      } else if (geomType === "MultiLineString") {
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
      // TODO: ANTON - Hitta någon smidig lösning för att förhindra att flera av samma punkt ritas.
      var graphic = new Graphic({
        geometry: geometry,
        symbol: symbol,
        attributes: feature.properties,
        popupTemplate: {
          title: "{NAMN}",
          content: "{BESKR_KORT}"
        }
      });
      //Lägger till olika lager baserat på kategorierna så det går att visa flera kategorier samtidigt.
      switch (sparFilName) {
        case "barnvanliga":
          barnvanligaLayer.add(graphic);
          map.add(barnvanligaLayer)
          break;
        case "motion":
          motionLayer.add(graphic);
          map.add(motionLayer);
          break;
        case "natur":
          naturLayer.add(graphic);
          map.add(naturLayer);
          break;
        case "service":
          serviceLayer.add(graphic);
          map.add(serviceLayer);
          break;
        case "trygghet":
          trygghetLayer.add(graphic);
          map.add(trygghetLayer);
          break;
      }
    });
  };

  //Med hjälp av knapp namn väljs kategori och skickas till getPoints
  function initButtons(point) {
    const buttons = document.querySelectorAll(".paneButton");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const categoryName = button.name;
        const fileList = categories[categoryName];
        sparFilName = categoryName;

        getPoints(poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList);
      });
      document.getElementById("resetUserPoint").addEventListener("click", () => {
        map.layers.removeAll();
        polyPoint = [];
      })
    });
  }

  input.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    searchJSON(input.value);
  }
  });

  function searchJSON(query) {
    searchList.innerHTML = "";

    const search = query.toLowerCase();

    const results = data.filter(item =>
    );
  }

  input.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    searchJSON(input.value);
  }
  });

  function searchJSON(query) {
    searchList.innerHTML = "";

    const search = query.toLowerCase();

    const results = data.filter(item =>
    );
  }

  //Funktion som lägger till användarens egna punkter.

  let polyPoint = [];
  view.on("click", function(event) {
    map.add(userLayer);

    if (document.getElementById("userPOIbox").checked == true) {
      document.getElementById("userPolygonbox").checked = false;

      let userPOIname = prompt("Skriv in namnet på din POI.");
      let userPOIdesc = prompt("Skriv in en beskrivning.");

      var geoPoint = webMercatorUtils.webMercatorToGeographic(event.mapPoint);
      var uPoint = new Point({
        longitude: geoPoint.x,
        latitude: geoPoint.y
      });
      var userPoint = new Graphic({
        geometry: uPoint,
        symbol: {
          type: "simple-marker",
          color: "pink",
          size: 8,
        },
        popupTemplate: {
          title: userPOIname,
          content: userPOIdesc
        }
      });
      userLayer.add(userPoint);
      //Funktion för att rita en polygon.
      //TODO: ANTON - Jag ska snygga till den här funktionen. Jag är inte alls överens med JavaScript...
    } else if (document.getElementById("userPolygonbox").checked == true) {
      document.getElementById("userPOIbox").checked = false;

      var geoPoint = webMercatorUtils.webMercatorToGeographic(event.mapPoint);
      polyPoint.push([geoPoint.x, geoPoint.y]);

      var userPolyPoint = new Graphic({
        geometry: new Point({
          longitude: geoPoint.x,
          latitude: geoPoint.y,
        }),
        symbol: {
          type: "simple-marker",
          color: "pink",
          size: 8,
        },

      });
      userLayer.add(userPolyPoint);
      const polygon = new Polygon({
        rings: [polyPoint],
      })
      var userPolygon = new Graphic({
        geometry: polygon,
        symbol: {
          type: "simple-fill",
          color: [255, 0, 255, 0.2],
          size: 8,
        },
      });
      userLayer.add(userPolygon);
    }
  });
  //Funktion som lägger till användarens egna punkter.

  let polyPoint = [];
  view.on("click", function(event) {
    map.add(userLayer);

    if (document.getElementById("userPOIbox").checked == true) {
      document.getElementById("userPolygonbox").checked = false;

      let userPOIname = prompt("Skriv in namnet på din POI.");
      let userPOIdesc = prompt("Skriv in en beskrivning.");

      var geoPoint = webMercatorUtils.webMercatorToGeographic(event.mapPoint);
      var uPoint = new Point({
        longitude: geoPoint.x,
        latitude: geoPoint.y
      });
      var userPoint = new Graphic({
        geometry: uPoint,
        symbol: {
          type: "simple-marker",
          color: "pink",
          size: 8,
        },
        popupTemplate: {
          title: userPOIname,
          content: userPOIdesc
        }
      });
      userLayer.add(userPoint);
      //Funktion för att rita en polygon.
      //TODO: ANTON - Jag ska snygga till den här funktionen. Jag är inte alls överens med JavaScript...
    } else if (document.getElementById("userPolygonbox").checked == true) {
      document.getElementById("userPOIbox").checked = false;

      var geoPoint = webMercatorUtils.webMercatorToGeographic(event.mapPoint);
      polyPoint.push([geoPoint.x, geoPoint.y]);

      var userPolyPoint = new Graphic({
        geometry: new Point({
          longitude: geoPoint.x,
          latitude: geoPoint.y,
        }),
        symbol: {
          type: "simple-marker",
          color: "pink",
          size: 8,
        },

      });
      userLayer.add(userPolyPoint);
      const polygon = new Polygon({
        rings: [polyPoint],
      })
      var userPolygon = new Graphic({
        geometry: polygon,
        symbol: {
          type: "simple-fill",
          color: [255, 0, 255, 0.2],
          size: 8,
        },
      });
      userLayer.add(userPolygon);
    }
  });
  initButtons();
});

