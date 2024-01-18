let geojson;
let projectionTypes = [
  "Mercator",
  "AzimuthalEqualArea",
  "AzimuthalEquidistant",
  "Gnomonic",
  "Orthographic",
  "Stereographic",
  "Albers",
  "ConicConformal",
  "ConicEqualArea",
  "ConicEquidistant",
  "Equirectangular",
  "TransverseMercator",
];

let projection;
let geoGenerator = d3.geoPath().projection(projection);

let graticule = d3.geoGraticule();

const sensitivity = 75;

let circles = [
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
let geoCircle = d3.geoCircle().radius(10).precision(1);

let state = {
  type: projectionTypes[0],
  scale: 120,
  translateX: 450,
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
  // Update projection
  let orthographicProjection = d3["geo" + "Orthographic"]();
  let orthographicGeoGenerator = d3
    .geoPath()
    .projection(orthographicProjection);

  orthographicGeoGenerator.projection(orthographicProjection);

  orthographicProjection
    .scale(state.scale)
    .translate([state.translateX, state.translateY])
    .center([state.centerLon, state.centerLat])
    .rotate([state.rotateLambda, state.rotatePhi, state.rotateGamma]);

  let svg = d3.select("#orthographic");

  // Update world map
  let u = svg.select("g.map").selectAll("path").data(geojson.features);

  u.enter().append("path").merge(u).attr("d", orthographicGeoGenerator);

  // Update projection center
  let projectedCenter = orthographicProjection([
    state.centerLon,
    state.centerLat,
  ]);
  svg
    .select(".projection-center")
    .attr("cx", projectedCenter[0])
    .attr("cy", projectedCenter[1]);

  // Update graticule
  svg
    .select(".graticule path")
    .datum(graticule())
    .attr("d", orthographicGeoGenerator);

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

  u.enter().append("path").merge(u).attr("d", orthographicGeoGenerator);
}

function updateProjection() {
  // Update projection
  let projection = d3["geo" + state.type]();
  let geoGenerator = d3.geoPath().projection(projection);

  geoGenerator.projection(projection);

  projection
    .scale(state.scale)
    .translate([state.translateX, state.translateY])
    .center([state.centerLon, state.centerLat])
    .rotate([state.rotateLambda, state.rotatePhi, state.rotateGamma]);

  let svg = d3.select("#projection");

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

function attachDragListener() {
  let svg = d3.select("#orthographic");

  svg.call(
    d3.drag().on("drag", (e) => {
      const k = sensitivity / state.scale;
      state.rotateLambda = state.rotateLambda + e.dx * k;
      state.rotatePhi = state.rotatePhi - e.dy * k;
      update();
    })
  );
}

d3.json(
  "https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json"
).then(function (json) {
  geojson = json;
  initMenu();
  update();
  attachDragListener();
});