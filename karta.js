let map, view, graphicsLayer//, sparFilName

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

  let loadedCategories = new Set();
  let allLoadedData = [];

  async function fetchData(file, category) {
    try{
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const data = await response.json();
      return {data, category};
    } catch (err) {
      console.error("fetchData Error:", err);
      return {data: null, category};
    }
  }

  //Får filnamn (utan filändelse) i form av en lista och skickar det med rätt filändelse till showPoints
  function getPoints(poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList, category) {
    fileList.forEach(fileName => {
      var json_file = ("JSON/" + fileName + ".json")

      fetchData(json_file, category).then(({data, category}) => {
        if (data && data.features) {
          showPoints(data, poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, category);
        } else {
          console.warn(`Invalid or empty data for file ${json_file}`);
        }
      });
    });
  }

  function showPoints(data, poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, category) {
      data.features.forEach(feature => {
      allLoadedData.push({
        ...feature,
        category: category
      })

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
      switch (category) {
        case "barnvanliga":
          barnvanligaLayer.add(graphic);
          map.add(barnvanligaLayer);
          loadedCategories.add("barnvanliga");
          break;
        case "motion":
          motionLayer.add(graphic);
          map.add(motionLayer);
          loadedCategories.add("motion");
          break;
        case "natur":
          naturLayer.add(graphic);
          map.add(naturLayer);
          loadedCategories.add("natur");
          break;
        case "service":
          serviceLayer.add(graphic);
          map.add(serviceLayer);
          loadedCategories.add("service");
          break;
        case "trygghet":
          trygghetLayer.add(graphic);
          map.add(trygghetLayer);
          loadedCategories.add("trygghet");
          break;
      }
    });

    loadedCategories.add(category);
  };

  //Med hjälp av knapp namn väljs kategori och skickas till getPoints
  function initButtons(point) {
    const buttons = document.querySelectorAll(".paneButton");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const categoryName = button.name;
        const fileList = categories[categoryName];
        //sparFilName = categoryName;

        getPoints(poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList, categoryName);
      });
      document.getElementById("resetUserPoint").addEventListener("click", () => {
        map.layers.removeAll();
        polyPoint = [];
        loadedCategories.clear();
      })
    });
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

  const input = document.getElementById("searchBox");
  const searchResult = document.getElementById("searchResult");

  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      searchJSON(input.value);
    }
  });

  //Sök funktion
  async function searchJSON(query) {
    searchResult.innerHTML = "";
    const search = query.toLowerCase();

    if (loadedCategories.size === 0) {
      await loadAllCategoriesForSearch();
    }

    const results = allLoadedData.filter(feature => {
      const name = feature.properties?.NAMN?.toLowerCase() || "";
      const description = feature.properties?.BESKT_KORT?.toLowerCase() || "";
      return name.includes(search) || description.includes(search);
    });

    if (results.length === 0) {
      searchResult.innerHTML = "<li>Inga träffar hittades.</li>";
    } else {
      results.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.properties.NAMN} (${item.category})`;
        searchResult.appendChild(li);
      });
    }
  }

  async function loadAllCategoriesForSearch() {
    allLoadedData = [];
    const promises = [];

    for (const [category, fileList] of Object.entries(categories)) {
      fileList.forEach(fileName => {
        var json_file = ("JSON/" + fileName + ".json")
        promises.push(fetchData(json_file, category));
      })
    }

    const results = await Promise.all(promises);
    console.log("results from fetchData:", results);
    results.forEach(({data, category}) => {
      if (data && data.features) {
        data.features.forEach(feature => {
          allLoadedData.push({
            ...feature,
            category: category
          });
        });
      } else {
        console.warn("Missing features in:", category);
      }
    });
  }
  initButtons();
});


