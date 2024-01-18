let geojson;
const projectionTypes = [
  "Mercator",
  "AzimuthalEqualArea",
  "AzimuthalEquidistant",
  "Gnomonic",
  "Orthographic",
  "Stereographic",
  "Albers",
  "AlbersUsa",
  "ConicConformal",
  "ConicEqualArea",
  "ConicEquidistant",
  "Equirectangular",
  "TransverseMercator",
  "EqualEarth",
  "NaturalEarth1",
];

const dragSensitivity = 75;
const translateSensitivity = 4;

let graticule = d3.geoGraticule();

const circles = [
  [-135, 0],
  [-90, 0],
  [-45, 0],
  [0, 0],
  [45, 0],
  [90, 0],
  [135, 0],
  [180, 0],
  [0, -70],
  [0, -35],
  [0, 35],
  [0, 70],
  [180, -70],
  [180, -35],
  [180, 35],
  [180, 70],
];
const geoCircle = d3.geoCircle().radius(10).precision(1);

let state = {
  type: projectionTypes[0],
  scale: 120,
  translateX: window.innerWidth / 4,
  translateY: 250,
  centerLon: 0,
  centerLat: 0,
  rotateLambda: 0.1,
  rotatePhi: 0,
  rotateGamma: 0,
};

function initMenu() {
  d3.select("#menu")
    .selectAll(".slider.item input")
    .on("input", function (d) {
      let attr = d3.select(this).attr("name");
      state[attr] = this.value;
      d3.select(this.parentNode.parentNode).select(".value").text(this.value);
      update();
    });

  d3.select("#menu .projection-type select")
    .on("change", function (d) {
      state.type = this.options[this.selectedIndex].value;
      update();
    })
    .selectAll("option")
    .data(projectionTypes)
    .enter()
    .append("option")
    .attr("value", function (d) {
      return d;
    })
    .text(function (d) {
      return d;
    });
}

function update() {
  updateOrthographic();
  updateProjection();
}

function updateOrthographic() {
  let svg = d3.select("#orthographic");
  let orthographicProjection = d3["geo" + "Orthographic"]();

  updateSVG(svg, orthographicProjection);
}

function updateProjection() {
  let svg = d3.select("#projection");
  let projection = d3["geo" + state.type]();

  updateSVG(svg, projection);
}

function updateSVG(svg, projection) {
  let geoGenerator = d3.geoPath().projection(projection);

  projection
    .scale(state.scale)
    .translate([state.translateX, state.translateY])
    .center([state.centerLon, state.centerLat])
    .rotate([state.rotateLambda, state.rotatePhi, state.rotateGamma]);

  // Update world map
  let u = svg.select("g.map").selectAll("path").data(geojson.features);

  u.enter().append("path").merge(u).attr("d", geoGenerator);

  // Update projection center
  let projectedCenter = projection([state.centerLon, state.centerLat]);
  svg
    .select(".projection-center")
    .attr("cx", projectedCenter[0])
    .attr("cy", projectedCenter[1]);

  // Update graticule
  svg.select(".graticule path").datum(graticule()).attr("d", geoGenerator);

  // Update circles
  u = svg
    .select(".circles")
    .selectAll("path")
    .data(
      circles.map(function (d) {
        geoCircle.center(d);
        return geoCircle();
      })
    );

  u.enter().append("path").merge(u).attr("d", geoGenerator);
}

function attachListeners() {
  let svg = d3.select("#orthographic");

  svg
    .call(
      d3.drag().on("drag", (e) => {
        const k = dragSensitivity / state.scale;
        state.rotateLambda = state.rotateLambda + e.dx * k;
        state.rotatePhi = state.rotatePhi - e.dy * k;
        update();
      })
    )
    .call(
      d3.zoom().on("zoom", (e) => {
        const temp = state.scale * e.transform.k;
        if (temp > 200) {
          e.transform.k = 200 / state.scale;
        }
        if (temp < 20) {
          e.transform.k = 20 / state.scale;
        }
        state.scale = state.scale * e.transform.k;
        console.log(state.scale);
        update();
      })
    );

  document.onkeydown = checkKey;

  function checkKey(e) {
    e = e || window.event;

    if (e.shiftKey) {
      if (e.keyCode == "38") {
        state.centerLat = state.centerLat + translateSensitivity;
      }
      if (e.keyCode == "40") {
        state.centerLat = state.centerLat - translateSensitivity;
      }
      if (e.keyCode == "37") {
        state.centerLon = state.centerLon - translateSensitivity;
      }
      if (e.keyCode == "39") {
        state.centerLon = state.centerLon + translateSensitivity;
      }
    } else if (e.metaKey) {
      if (e.keyCode == "37") {
        state.rotateGamma = state.rotateGamma + translateSensitivity;
      }
      if (e.keyCode == "39") {
        state.rotateGamma = state.rotateGamma - translateSensitivity;
      }
    } else {
      if (e.keyCode == "38") {
        state.translateY = state.translateY - translateSensitivity;
      }
      if (e.keyCode == "40") {
        state.translateY = state.translateY + translateSensitivity;
      }
      if (e.keyCode == "37") {
        state.translateX = state.translateX - translateSensitivity;
      }
      if (e.keyCode == "39") {
        state.translateX = state.translateX + translateSensitivity;
      }
    }

    update();
  }
}

d3.json(
  "https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json"
).then(function (json) {
  geojson = json;
  initMenu();
  update();
  attachListeners();
});
