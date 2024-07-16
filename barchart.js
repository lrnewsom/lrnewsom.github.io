// I referenced the example js heavily on this first project, but I have come back and added my own personal flair after finishing the other projects and having a better understanding of d3 and js.

var width = 800,
  height = 400,
  barWidth = width / 275;
var body = d3.select("body");
var tooltip = body
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

var svgContainer = d3
  .select(".visHolder")
  .append("svg")
  .attr("width", width + 100)
  .attr("height", height + 60);

d3.json(
  "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/GDP-data.json"
)
  .then((data) => {
    svgContainer
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 0 - height / 1.5)
      .attr("y", 80)
      .text("Gross Domestic Product");
    svgContainer
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 0 - height / 1.65)
      .attr("y", 100)
      .text("In Billions USD");

    var years = data.data.map(function (item) {
      var quarter;
      var temp = item[0].substring(5, 7);

      if (temp === "01") {
        quarter = "Q1";
      } else if (temp === "04") {
        quarter = "Q2";
      } else if (temp === "07") {
        quarter = "Q3";
      } else if (temp === "10") {
        quarter = "Q4";
      }

      return item[0].substring(0, 4) + " " + quarter;
    });

    var yearsDate = data.data.map(function (item) {
      return new Date(item[0]);
    });

    var xMax = new Date(d3.max(yearsDate));
    xMax.setMonth(xMax.getMonth() + 3);
    var xScale = d3
      .scaleTime()
      .domain([d3.min(yearsDate), xMax])
      .range([0, width]);

    var xAxis = d3.axisBottom().scale(xScale);

    svgContainer
      .append("g")
      .call(xAxis)
      .attr("id", "x-axis")
      .attr("transform", "translate(60, 400)");

    var GDP = data.data.map(function (item) {
      return item[1];
    });

    var scaledGDP = [];

    var gdpMax = d3.max(GDP);

    const colorScale = d3
      .scaleLinear()
      .domain([0, gdpMax])
      .range(["#006400", "#7FFF00"]);

    var linearScale = d3.scaleLinear().domain([0, gdpMax]).range([0, height]);

    scaledGDP = GDP.map(function (item) {
      return linearScale(item);
    });

    var yAxisScale = d3.scaleLinear().domain([0, gdpMax]).range([height, 0]);

    var yAxis = d3.axisLeft(yAxisScale);

    svgContainer
      .append("g")
      .call(yAxis)
      .attr("id", "y-axis")
      .attr("transform", "translate(60, 0)");
    d3.select("svg")
      .selectAll("rect")
      .data(scaledGDP)
      .enter()
      .append("rect")
      .attr("data-date", function (d, i) {
        return data.data[i][0];
      })
      .attr("data-gdp", function (d, i) {
        return data.data[i][1];
      })
      .attr("class", "bar")
      .attr("x", function (d, i) {
        return xScale(yearsDate[i]);
      })
      .attr("y", function (d) {
        return height - d;
      })
      .attr("width", barWidth)
      .attr("height", function (d) {
        return d;
      })
      .attr("index", (d, i) => i)
      .style("fill", (d, i) => colorScale(data.data[i][1]))
      .attr("transform", "translate(60, 0)")
      .on("mouseover", function (event, d) {
        var i = this.getAttribute("index");
        var originalColor = d3.select(this).style("fill");

        // Change the rect color to blue
        d3.select(this)
          .style("fill", "red")
          .attr("data-original-color", originalColor);

        tooltip
          .style("opacity", 0.9)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px")
          .html(
            years[i] +
              "<br>" +
              "$" +
              GDP[i].toFixed(1).replace(/(\d)(?=(\d{3})+\.)/g, "$1,") +
              " Billion"
          )
          .attr("data-date", data.data[i][0]);
      })
      .on("mouseout", function () {
        // Revert the rect color back to original
        var originalColor = d3.select(this).attr("data-original-color");
        d3.select(this).style("fill", originalColor);

        tooltip.style("opacity", 0);
      });
  })
  .catch((e) => console.log(e));
