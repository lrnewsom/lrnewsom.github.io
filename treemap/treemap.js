// I used ChatGPT to learn how to properly do the legend for this visual, and for learning how to make treemaps in d3. I also visited the d3 documentation for help with the treemap before using ChatGPT.
var body = d3.select("body");
var svg = d3.select("svg");
var tooltip = body
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);
var legend = d3.select("#legend");

const dataset =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json";

d3.json(dataset).then((data) => {
  // Create a hierarchy from the data
  var root = d3
    .hierarchy(data)
    .sum(function (d) {
      return d.value;
    })
    .sort(function (a, b) {
      return b.height - a.height || b.value - a.value;
    });

  // Create a treemap layout
  d3.treemap().size([960, 600]).padding(1).round(true)(root);

  var categories = root.leaves().map((d) => d.data.category);
  var uniqueCats = [...new Set(categories)];
  var color = d3.scaleOrdinal().domain(uniqueCats).range(d3.schemeCategory10);

  // Bind data and append rects
  svg
    .selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
    .attr("class", "tile")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => color(d.data.category))
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => d.data.value)
    .on("mousemove", function (event, d) {
      tooltip
        .style("opacity", 0.9)
        .attr("data-value", d.data.value)
        .html(
          `Name: ${d.data.name}<br>Category: ${
            d.data.category
          }<br>Value: ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(d.data.value)}`
        ) // got the execution for this currency formatting from ChatGPT, but the idea was mine
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
    });

  svg
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
    .attr("x", (d) => d.x0 + 5)
    .attr("y", (d) => d.y0 + 20)
    .attr("font-size", "12px")
    .text((d) => {
      const maxWidth = d.x1 - d.x0 - 10; // Subtract some padding
      let text = d.data.name;
      let textWidth = getTextWidth(text, "12px sans-serif");
      while (textWidth > maxWidth) {
        text = text.slice(0, -1); // Remove one character at a time
        textWidth = getTextWidth(text + "...", "12px sans-serif");
      }
      return text + "...";
    });

  // Function to get text width
  function getTextWidth(text, font) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font;
    return context.measureText(text).width;
  }

  // making the legend
  var legendItems = legend
    .selectAll(".legend-item1")
    .data(uniqueCats)
    .enter()
    .append("div")
    .attr("class", "legend-item1");

  legendItems
    .append("rect")
    .attr("class", "legend-item")
    .style("fill", (d) => color(d))
    .style("background-color", (d) => color(d));

  legendItems
    .append("span")
    .style("padding-top", "3px")
    .text((d) => d);
});
