// set up the base variables for later use. The bar stuff will be calculated later.
var width = 800,
  height = 400,
  margin = { top: 20, right: 200, bottom: 80, left: 60 }; // Increased bottom margin for the legend

// make the tooltip variable, then init it later in the json section
var tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

// this will store the heat map diagram
var svgContainer = d3
  .select(".visHolder")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// load in the data and then generate the heat map for it
d3.json(
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
).then((data) => {
  // literally the rest of the code goes in this block
  var years = data.monthlyVariance.map(function (item) {
    return item.year;
  });
  var xMax = d3.max(years);
  var xMin = d3.min(years);
  var xScale = d3
    .scaleLinear()
    .domain([xMin - 1, xMax + 1])
    .range([0, width]);
  var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));

  svgContainer
    .append("g")
    .call(xAxis)
    .attr("id", "x-axis")
    .attr("transform", "translate(0," + height + ")");

  // yaxis
  var yScale = d3
    .scaleBand()
    // months (January to December, corrected domain)
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .rangeRound([0, height])
    .padding(0);

  var yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickValues(yScale.domain())
    .tickFormat(function (month) {
      var date = new Date(0);
      date.setUTCMonth(month);
      var format = d3.utcFormat("%B");
      return format(date);
    })
    .tickSize(10, 1);

  svgContainer
    .append("g")
    .attr("class", "y-axis")
    .attr("id", "y-axis")
    .attr("transform", "translate(0,0)")
    .call(yAxis);

  // Define color scale
  var colorScale = d3
    .scaleQuantile()
    .domain([
      d3.min(data.monthlyVariance, (d) => data.baseTemperature + d.variance),
      d3.max(data.monthlyVariance, (d) => data.baseTemperature + d.variance),
    ])
    .range(["#4575b4", "#91bfdb", "#e0f3f8", "#fee090", "#fc8d59", "#d73027"]);

  svgContainer
    .append("g")
    .attr("class", "map")
    .selectAll("rect")
    .data(data.monthlyVariance)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("data-year", function (d) {
      return d.year;
    })
    .attr("data-month", function (d) {
      return d.month - 1; // Adjust month to be 0-indexed
    })
    .attr("data-temp", function (d) {
      return data.baseTemperature + d.variance;
    })
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.month - 1))
    .attr("width", xScale(xMin + 1) - xScale(xMin)) // Calculate the bar width
    .attr("height", yScale.bandwidth()) // Use bandwidth for height
    .attr("fill", (d) => colorScale(data.baseTemperature + d.variance))
    .on("mouseover", function (event, d) {
      tooltip.style("opacity", 0.9);
      tooltip.attr("data-year", d.year);
      tooltip
        .html(
          "Year: " +
            d.year +
            "<br/>" +
            "Month: " +
            d3.timeFormat("%B")(new Date(0).setUTCMonth(d.month - 1)) +
            "<br/>" +
            "Temperature: " +
            (data.baseTemperature + d.variance).toFixed(2) +
            "°C" +
            "<br/>" +
            "Variance: " +
            d.variance.toFixed(2) +
            "°C"
        )
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });

  // Add legend
  var legendWidth = 400,
    legendHeight = 20;

  var legend = svgContainer
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      "translate(" +
        (width - legendWidth) +
        "," +
        (height + margin.bottom - legendHeight) +
        ")"
    );

  var legendValues = colorScale.quantiles();
  legendValues.unshift(
    d3.min(data.monthlyVariance, (d) => data.baseTemperature + d.variance)
  );
  legendValues.push(
    d3.max(data.monthlyVariance, (d) => data.baseTemperature + d.variance)
  );

  var legendScale = d3
    .scaleLinear()
    .domain([d3.min(legendValues), d3.max(legendValues)])
    .range([0, legendWidth]);

  var legendAxis = d3
    .axisBottom(legendScale)
    .tickValues(legendValues)
    .tickFormat(d3.format(".1f"));

  legend
    .selectAll("rect")
    .data(
      colorScale.range().map(function (d) {
        var invertExtent = colorScale.invertExtent(d);
        if (invertExtent[0] == null) invertExtent[0] = legendScale.domain()[0];
        if (invertExtent[1] == null) invertExtent[1] = legendScale.domain()[1];
        return invertExtent;
      })
    )
    .enter()
    .append("rect")
    .attr("x", (d) => legendScale(d[0]))
    .attr("y", 0)
    .attr("width", (d) => legendScale(d[1]) - legendScale(d[0]))
    .attr("height", legendHeight)
    .style("fill", (d) => colorScale(d[0]))
    .on("mouseover", function (event, d) {
      tooltip.style("opacity", 0.9);
      tooltip
        .html(
          "Temperature range: " +
            d[0].toFixed(2) +
            "°C - " +
            d[1].toFixed(2) +
            "°C"
        )
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });

  legend
    .append("g")
    .attr("transform", "translate(0," + legendHeight + ")")
    .call(legendAxis);
});
