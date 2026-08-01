var body = d3.select("body");
var svg = d3.select("svg");
var tooltip = body
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

const urlEd =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const urlCo =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

Promise.all([d3.json(urlEd), d3.json(urlCo)])
  .then(([edData, coData]) => {
    const minEd = d3.min(edData, (d) => d.bachelorsOrHigher);
    const maxEd = d3.max(edData, (d) => d.bachelorsOrHigher);
    var path = d3.geoPath();

    var xScale = d3.scaleLinear().domain([minEd, maxEd]).rangeRound([600, 860]);

    var color = d3
      .scaleThreshold()
      .domain(d3.range(minEd, maxEd, (maxEd - minEd) / 8))
      .range(d3.schemePurples[9]);

    var legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("id", "legend")
      .attr("transform", "translate(0, 50)");
    // I used the example's js code for help with the following block.
    legend
      .selectAll("rect")
      .data(
        color.range().map(function (d) {
          d = color.invertExtent(d);
          if (d[0] === null) d[0] = xScale.domain()[0];
          if (d[1] === null) d[1] = xScale.domain()[1];
          return d;
        })
      )
      .enter()
      .append("rect")
      .attr("height", 8)
      .attr("x", (d) => xScale(d[0]))
      .attr("width", (d) =>
        d[0] && d[1] ? xScale(d[1]) - xScale(d[0]) : xScale(null)
      )
      .attr("fill", (d) => color(d[0]));

    legend
      .append("text")
      .attr("class", "caption")
      .attr("x", xScale.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold");

    legend
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(13)
          .tickFormat((x) => Math.round(x) + "%")
          .tickValues(color.domain())
      )
      .select(".domain")
      .remove();

    svg
      .append("g")
      .attr("class", "counties")
      .selectAll("path")
      .data(topojson.feature(coData, coData.objects.counties).features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) => {
        var result = edData.filter((obj) => obj.fips === d.id);
        if (result[0]) {
          return result[0].bachelorsOrHigher;
        }
        console.log("could not find data for:", d.id);
        return 0;
      })
      .attr("fill", (d) => {
        var result = edData.filter((obj) => obj.fips === d.id);
        if (result[0]) {
          return color(result[0].bachelorsOrHigher);
        }
        return color(0);
      })
      .attr("d", path)
      .on("mousemove", function (event, d) {
        tooltip.style("opacity", 0.9);
        tooltip
          .html(() => {
            var result = edData.filter((obj) => obj.fips === d.id);
            if (result[0]) {
              return `${result[0].area_name}, ${result[0].state}: ${result[0].bachelorsOrHigher}%`;
            }
            return 0;
          })
          .attr("data-education", () => {
            var result = edData.filter((obj) => obj.fips === d.id);
            if (result[0]) {
              return result[0].bachelorsOrHigher;
            }
            return 0;
          })
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    //svg.append('path')
    //.datum(topojson.mesh(coData, coData.objects.states, (a, b) => a !== b))
    //.attr('class', 'states')
    //.attr('d', path);
  })
  .catch((err) => console.log(err));
