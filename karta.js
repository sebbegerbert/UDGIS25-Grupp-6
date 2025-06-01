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
  "esri/geometry/geometryEngine"

], function(Map, MapView, GraphicsLayer, Graphic, Point, Polyline, PictureMarkerSymbol, PopupTemplate, webMercatorUtils, Polygon, geometryEngine) {

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

  map.add(barnvanligaLayer);
  map.add(motionLayer);
  map.add(naturLayer);
  map.add(serviceLayer);
  map.add(trygghetLayer);
  map.add(userLayer);
  //Kategorier med filnamn utan filändelse 
  const categories = {
    barnvanliga: ["lekplatser", "pulkabackar"],
    motion: ["utegym", "motionsspar", "idrott_motion", "spontanidrott"],
    natur: ["badplatser", "rastplatser", "parkmobler"],
    service: ["offentliga_toaletter", "papperskorgar"],
    trygghet: ["livraddningsutrustning"]
  };
  let barnvanligaToggle = false, motionToggle = false, naturToggle = false, serviceToggle = false, trygghetToggle = false;

  let loadedCategories = new Set();
  let allLoadedData = [];
  const allGraphics = [];
  var motionssparByName = [];

  async function fetchData(file, category) {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const data = await response.json();
      return { data, category };
    } catch (err) {
      console.error("fetchData Error:", err);
      return { data: null, category };
    }
  }

  //Får filnamn (utan filändelse) i form av en lista och skickar det med rätt filändelse till showPoints
  function getPoints(poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList, category) {
    fileList.forEach(fileName => {
      var json_file = ("JSON/" + fileName + ".json")

      fetchData(json_file, category).then(({ data, category }) => {
        if (data && data.features) {
          showPoints(data, poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, category, fileName);
        } else {
          console.warn(`Invalid or empty data for file ${json_file}`);
        }
      });
    });
  }

  function showPoints(data, poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, category, fileName) {
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
          type: "picture-marker",
          url: `icon/${fileName}.png`,
          color: "pink",
          size: 8
        };
      } else if (geomType === "LineString") {
        geometry = {
          type: "polyline",
          paths: [coord]
        };
        const color = stringToColor(feature.properties.NAMN);
        symbol = {
          type: "simple-line",
          color: color,
          width: 2
        };
      } else if (geomType === "MultiLineString") {
        geometry = {
          type: "polyline",
          paths: [coord]
        };
        const color = stringToColor(feature.properties.NAMN);
        symbol = {
          type: "simple-line",
          color: color,
          width: 2
        };
      } else {
        console.warn("Unsupported geometry type:", geomType)
      }

      //Ritar geometrier och lägger till popup ruta
      const graphic = new Graphic({
        geometry: geometry,
        symbol: symbol,
        attributes: feature.properties,
        popupTemplate: {
          title: "{NAMN}",
          content: "{BESKR_KORT}"
        }
      });

      allGraphics.push({
        graphic: graphic,
        category: category,
        feature: feature
      });

      //Lägger till olika lager baserat på kategorierna så det går att visa flera kategorier samtidigt.
      switch (category) {
        case "barnvanliga":
          if (barnvanligaToggle == true) {
            barnvanligaLayer.add(graphic);
            loadedCategories.add("barnvanliga");
          } else if (barnvanligaToggle == false) {
            barnvanligaLayer.removeAll();
            loadedCategories.delete("barnvanliga");
          }
          break;
        case "motion":
          if (feature.geometry.type == "LineString" || feature.geometry.type == "MultiLineString") {
            const name = (feature.properties.NAMN).trim();
            motionssparByName[name] = graphic;
          }
          if (motionToggle == true) {
            motionLayer.add(graphic);
            loadedCategories.add("motion");
          } else if (motionToggle == false) {
            document.getElementById("motionssparDiv").style.visibility = "hidden";
            resetMotionsboxes();
            motionLayer.removeAll();
            loadedCategories.delete("motion");
          } break;
        case "natur":
          if (naturToggle == true) {
            naturLayer.add(graphic);
            loadedCategories.add("natur");
          } else if (naturToggle == false) {
            naturLayer.removeAll();
            loadedCategories.delete("natur");
          }
          break;
        case "service":
          if (serviceToggle == true) {
            serviceLayer.add(graphic);
            loadedCategories.add("service");
          } else if (serviceToggle == false) {
            serviceLayer.removeAll();
            loadedCategories.delete("service");
          }
          break;
        case "trygghet":
          if (trygghetToggle == true) {
            trygghetLayer.add(graphic);
            loadedCategories.add("trygghet");
          } else if (trygghetToggle == false) {
            trygghetLayer.removeAll();
            loadedCategories.delete("trygghet");
          } break;
      }
    });

    loadedCategories.add(category);
  };

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  }

  //Med hjälp av knapp namn väljs kategori och skickas till getPoints
  function initButtons(point) {
    const buttons = document.querySelectorAll(".paneButton");
    const motionsButtons = document.querySelectorAll(".motionCheckbox")

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const categoryName = button.name;
        const fileList = categories[categoryName];
        //sparFilName = categoryName;
        switch (categoryName) {
          case "barnvanliga":
            if (barnvanligaToggle == false)
              barnvanligaToggle = true;
            else if (barnvanligaToggle == true) {
              barnvanligaToggle = false;
            }
            break;
          case "motion":
            if (motionToggle == false)
              motionToggle = true;
            else if (motionToggle == true) {
              motionToggle = false;
            }
            break;
          case "natur":
            if (naturToggle == false)
              naturToggle = true;
            else if (naturToggle == true) {
              naturToggle = false;
            }
            break;
          case "service":
            if (serviceToggle == false)
              serviceToggle = true;
            else if (serviceToggle == true) {
              serviceToggle = false;
            }
            break;
          case "trygghet":
            if (trygghetToggle == false)
              trygghetToggle = true;
            else if (trygghetToggle == true) {
              trygghetToggle = false;
            }
            break;
        }


        getPoints(poiLayer, barnvanligaLayer, motionLayer, naturLayer, serviceLayer, trygghetLayer, Graphic, Point, PictureMarkerSymbol, PopupTemplate, fileList, categoryName);
        if (categoryName == "motion") {
          document.getElementById("motionssparDiv").style.visibility = "visible";
        }
      });
      // Initierar knapparna för att välja enskilda motionsspår.
      motionsButtons.forEach(checkbox => {
        const motionssparNamn = checkbox.id;
        const motionssparGraphic = motionssparByName[motionssparNamn];

        checkbox.addEventListener("change", () => {
          const motionssparNamn = checkbox.id;
          const motionssparGraphic = motionssparByName[motionssparNamn];
          if (motionssparGraphic) {
            motionssparGraphic.visible = checkbox.checked;
          }
        })

      })
      document.getElementById("resetUserPoint").addEventListener("click", () => {
        // map.layers.removeAll();
        polyPoint = [];
        barnvanligaLayer.removeAll();
        motionLayer.removeAll();
        naturLayer.removeAll();
        serviceLayer.removeAll();
        trygghetLayer.removeAll();
        userLayer.removeAll();
        loadedCategories.clear();
        document.getElementById("motionssparDiv").style.visibility = "hidden";
        resetMotionsboxes();
        barnvanligaToggle = false, motionToggle = false, naturToggle = false, serviceToggle = false, trygghetToggle = false;
      })
      //Knappar för att visa eller dölja alla spår.
      document.getElementById("resetMotionsspar").addEventListener("click", resetMotionsboxes);
      document.getElementById("hideMotionsspar").addEventListener("click", unsetMotionsboxes);
    });
  }

  //Funktion som lägger till användarens egna punkter.

  let polyPoint = [];
  view.on("click", function(event) {

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
      polygonFiler(polygon)
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
  async function searchJSON(query, Graphic) {
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

    let geometry;
    let symbol;

    if (results.length === 0) {
      searchResult.innerHTML = "<li>Inga träffar hittades.</li>";
    }
    results.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.properties.NAMN} (${item.category})`;

      li.addEventListener("click", () => {
        searchResult.innerHTML = "";
        const geomType = item.geometry.type;
        const coord = item.geometry.coordinates;

        let centerPoint;

        if (geomType === "Point") {
          centerPoint = {
            type: "point",
            longitude: coord[0],
            latitude: coord[1]
          };
          symbol = {

          }
        } else if (geomType === "LineString") {
          const firstCoord = coord[0];
          centerPoint = {
            type: "point",
            longitude: firstCoord[0],
            latitude: firstCoord[1]
          };
        } else if (geomType === "MultiLineString") {
          const firstCoord = coord[0][0];
          centerPoint = {
            type: "point",
            longitude: firstCoord[0],
            latitude: firstCoord[1]
          };
        } else {
          console.warn("Unsuported geometry for centering:", geomType);
          return;
        }

        view.goTo({
          target: new Point(centerPoint),
          zoom: 15
        }).then(() => {
          view.popup.open({
            location: new Point(centerPoint),
            title: item.properties.NAMN || "Ingen titel",
            content: item.properties.BESKR_KORT || "Ingen beskrivning",
          });
        });
      });
      searchResult.appendChild(li);
    });
  }

  async function loadAllCategoriesForSearch() {
    allLoadedData = [];
    const promises = [];

    for (const [category, fileList] of Object.entries(categories)) {
      fileList.forEach(fileName => {
        var json_file = ("JSON/" + fileName + ".json")
        promises.push(fetchData(json_file, category));
      });
    }

    const results = await Promise.all(promises);
    console.log("results from fetchData:", results);
    results.forEach(({ data, category }) => {
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

  function polygonFiler(polygon) {
    allGraphics.forEach(({ graphic }) => {
      var isInside = geometryEngine.contains(polygon, graphic.geometry);
      graphic.visible = isInside;
    });
  }

  function resetMotionsboxes() {
    const motionsboxes = document.querySelectorAll(".motionCheckbox")

    motionsboxes.forEach(checkbox => {
      checkbox.checked = true;
      const motionssparNamn = checkbox.id;
      const motionssparGraphic = motionssparByName[motionssparNamn];
      if (motionssparGraphic) {
        motionssparGraphic.visible = checkbox.checked;
      }
    })
  }

  function unsetMotionsboxes() {
    const motionsboxes = document.querySelectorAll(".motionCheckbox")

    motionsboxes.forEach(checkbox => {
      checkbox.checked = false;
      const motionssparNamn = checkbox.id;
      const motionssparGraphic = motionssparByName[motionssparNamn];
      if (motionssparGraphic) {
        motionssparGraphic.visible = checkbox.checked;
      }
    })
  }
  initButtons();
});


