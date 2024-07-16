var width = 800,
  height = 400,
  radius = 5,
  margin = { top: 20, right: 200, bottom: 40, left: 60 }; // Increase the right margin for the legend

// Define the div for the tooltip
var div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

var svgContainer = d3
  .select(".visHolder")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json(
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json"
).then((data) => {
  var years = data.map(function (item) {
    return item.Year;
  });

  var xMax = d3.max(years);
  var xMin = d3.min(years);
  var xScale = d3
    .scaleLinear()
    .domain([xMin - 1, xMax + 1]) // Add some padding to the domain
    .range([0, width]);

  var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));

  svgContainer
    .append("g")
    .call(xAxis)
    .attr("id", "x-axis")
    .attr("transform", "translate(0," + height + ")");

  var parseTime = d3.timeParse("%M:%S");
  var times = data.map(function (item) {
    var t = parseTime(item.Time);
    return t.getMinutes() * 60 + t.getSeconds();
  });

  var minTime = d3.min(times);

  var yScale = d3
    .scaleLinear()
    .domain([d3.max(times), minTime])
    .range([height, 0]);

  var yAxis = d3.axisLeft(yScale).tickFormat(function (d) {
    var minutes = Math.floor(d / 60);
    var seconds = d % 60;
    return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
  });

  svgContainer.append("g").call(yAxis).attr("id", "y-axis");

  svgContainer
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", radius)
    .attr("cx", (d) => xScale(d.Year))
    .attr("cy", (d) =>
      yScale(
        parseTime(d.Time).getMinutes() * 60 + parseTime(d.Time).getSeconds()
      )
    )
    .attr("fill", (d) => (d.Doping ? "red" : "blue")) // Change color based on doping status
    .attr("data-xvalue", (d) => d.Year)
    .attr(
      "data-yvalue",
      (d) =>
        new Date(
          1970,
          0,
          1,
          0,
          parseTime(d.Time).getMinutes(),
          parseTime(d.Time).getSeconds()
        )
    ) // Set data-yvalue correctly
    .on("mouseover", function (event, d) {
      div.style("opacity", 0.9);
      div.attr("data-year", d.Year);
      div
        .html(
          `${d.Name}: ${d.Nationality}<br/>
            Year: ${d.Year}, Time: ${d.Time}`
        )
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      div.style("opacity", 0);
    });

  // Legend
  var legend = svgContainer
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(" + (width + 20) + "," + 20 + ")");

  var legendData = [
    { color: "red", label: "Doping Allegations" },
    { color: "blue", label: "No Doping Allegations" },
  ];

  legend
    .selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d) => d.color);

  legend
    .selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 24)
    .attr("y", (d, i) => i * 20 + 9) // Adjusted to position text better
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .style("font-size", "12px") // Ensure font size is readable
    .style("fill", "#000") // Set text color to black for visibility
    .text((d) => d.label);
});
