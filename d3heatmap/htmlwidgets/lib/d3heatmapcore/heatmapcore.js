function heatmap(selector, data, newWickString, options) 
{	console.log("d3HeatMap: Last Updated 20,May [2:56 PM]")
    dend_row_newick_format = newWickString;
    dend_row_2 = "((1:0.538675539544001,2:0.538675539544001):0.920727489814388,(3:0.637623672741258,(4:0.642448944476138,5:0.642448944476138):0.637623672741258):0.920727489814388)";
    objectA = {xlocation: null, ylocation:null};
    location_object_array = []; // TAKE CARE OF THIS !!
    cluster_change_rows = []; // TAKE CARE OF THIS !!
    numair_nodes = []; 
    number_of_columns = data.matrix.cols.length;
  // Saving the cluster information into an array called cluster.
  for(i in data.owncluster) {cluster = data.owncluster[i];}
  // ==== BEGIN HELPERS =================================
  
  function htmlEscape(str) {
    return (str+"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  
  // Given a list of widths/heights and a total width/height, provides
  // easy access to the absolute top/left/width/height of any individual
  // grid cell. Optionally, a single cell can be specified as a "fill"
  // cell, meaning it will take up any remaining width/height.
  // 
  // rows and cols are arrays that contain numeric pixel dimensions,
  // and up to one "*" value.
  function GridSizer(widths, heights, /*optional*/ totalWidth, /*optional*/ totalHeight) {
    this.widths = widths;
    this.heights = heights;
  
    var fillColIndex = null;
    var fillRowIndex = null;
    var usedWidth = 0; 
    var usedHeight = 0;
    var i;
    for (i = 0; i < widths.length; i++) {
      if (widths[i] === "*") {
        if (fillColIndex !== null) {
          throw new Error("Only one column can be designated as fill");
        }
        fillColIndex = i;
      } else {
        usedWidth += widths[i];
      }
    }
    if (fillColIndex !== null) {
      widths[fillColIndex] = totalWidth - usedWidth;
    } else {
      if (typeof(totalWidth) === "number" && totalWidth !== usedWidth) {
        throw new Error("Column widths don't add up to total width");
      }
    }
    for (i = 0; i < heights.length; i++) {
      if (heights[i] === "*") {
        if (fillRowIndex !== null) {
          throw new Error("Only one row can be designated as fill");
        }
        fillRowIndex = i;
      } else {
        usedHeight += heights[i];
      }
    }
    if (fillRowIndex !== null) {
      heights[fillRowIndex] = totalHeight - usedHeight;
    } else {
      if (typeof(totalHeight) === "number" && totalHeight !== usedHeight) {
        throw new Error("Column heights don't add up to total height");
      }
    }
  }
  
  GridSizer.prototype.getCellBounds = function(x, y) {
    if (x < 0 || x >= this.widths.length || y < 0 || y >= this.heights.length)
      throw new Error("Invalid cell bounds");
  
    var left = 0;
    for (var i = 0; i < x; i++) {
      left += this.widths[i];
    }
  
    var top = 0;
    for (var j = 0; j < y; j++) {
      top += this.heights[j];
    }
  
    return {
      width: this.widths[x],
      height: this.heights[y],
      top: top,
      left: left
    }
  }
  
  // ==== END HELPERS ===================================


  var el = d3.select(selector);

  var bbox = el.node().getBoundingClientRect();

  var Controller = function() {
    this._events = d3.dispatch("highlight", "datapoint_hover", "transform");
    this._highlight = {x: null, y: null};
    this._datapoint_hover = {x: null, y: null, value: null};
    this._transform = null;
    this._highlight_line = null;
  };
  (function() {
    this.highlight = function(x, y) {
      // Copy for safety
      if (!arguments.length) return {x: this._highlight.x, y: this._highlight.y};

      if (arguments.length == 1) {
        this._highlight = x;
      } else {
        this._highlight = {x: x, y: y};
      }
      this._events.highlight.call(this, this._highlight);
    };

    this.datapoint_hover = function(_) {
      if (!arguments.length) return this._datapoint_hover;
      
      this._datapoint_hover = _;
      this._events.datapoint_hover.call(this, _);
    };

    this.transform = function(_) {
      if (!arguments.length) return this._transform;
      this._transform = _;
      this._events.transform.call(this, _);
    };
    this.highlight_line = function(_){
    	if (!arguments.length) return this._highlight_line;
    	this._highlight_line = _;
    	this._events.highlight_line.call(this, _);
    }

    this.on = function(evt, callback) {
      this._events.on(evt, callback);
    };
  }).call(Controller.prototype);

  var controller = new Controller();

  // Set option defaults
  var opts = {};
  options = options || {};
  opts.width = options.width || bbox.width;
  opts.height = options.height || bbox.height;
  opts.xclust_height = options.xclust_height || opts.height * 0.12;
  opts.yclust_width = options.yclust_width || opts.width * 0.12;
  opts.link_color = opts.link_color || "#AAA";
  opts.xaxis_height = options.xaxis_height || 80;
  opts.yaxis_width = options.yaxis_width || 120;
  opts.axis_padding = options.axis_padding || 6;
  opts.show_grid = options.show_grid;
  if (typeof(opts.show_grid) === 'undefined') {
    opts.show_grid = true;
  }
  opts.brush_color = options.brush_color || "#0000FF";
  opts.xaxis_font_size = options.xaxis_font_size;
  opts.yaxis_font_size = options.yaxis_font_size;
  opts.anim_duration = options.anim_duration;
  if (typeof(opts.anim_duration) === 'undefined') {
    opts.anim_duration = 500;
  }

  if (!data.rows) {
    opts.yclust_width = 0;
  }
  if (!data.cols) {
    opts.xclust_height = 0;
  }
  
  var gridSizer = new GridSizer(
    [opts.yclust_width, "*", opts.yaxis_width],
    [opts.xclust_height, "*", opts.xaxis_height],
    opts.width,
    opts.height
  );

  var colormapBounds = gridSizer.getCellBounds(1, 1);
  var colDendBounds = gridSizer.getCellBounds(1, 0);
  var rowDendBounds = gridSizer.getCellBounds(0, 1);
  var yaxisBounds = gridSizer.getCellBounds(2, 1);
  var xaxisBounds = gridSizer.getCellBounds(1, 2);

  function cssify(styles) {
    return {
      position: "absolute",
      top: styles.top + "px",
      left: styles.left + "px",
      width: styles.width + "px",
      height: styles.height + "px"
    };
  }

  // Create DOM structure
  (function() {
    var inner = el.append("div").classed("inner", true);
    var info = inner.append("div").classed("info", true);
    var colmap = inner.append("svg").classed("colormap", true).style(cssify(colormapBounds));
    var colDend = inner.append("svg").classed("dendrogram colDend", true).style(cssify(colDendBounds));
    var rowDend = inner.append("svg").classed("dendrogram rowDend", true).style(cssify(rowDendBounds));
    
    var xaxis = inner.append("svg").classed("axis xaxis", true).style(cssify(xaxisBounds));
    var yaxis = inner.append("svg").classed("axis yaxis", true).style(cssify(yaxisBounds));
    
    // Hack the width of the x-axis to allow x-overflow of rotated labels; the
    // QtWebkit viewer won't allow svg elements to overflow:visible.
    xaxis.style("width", (opts.width - opts.yclust_width) + "px");
    xaxis
      .append("defs")
        .append("clipPath").attr("id", "xaxis-clip")
          .append("polygon")
            .attr("points", "" + [
              [0, 0],
              [xaxisBounds.width, 0],
              [xaxisBounds.width + yaxisBounds.width, xaxisBounds.height],
              [0, xaxisBounds.height]
            ]);
    xaxis.node(0).setAttribute("clip-path", "url(#xaxis-clip)");

    inner.on("click", function() {
      controller.highlight(null, null);
    });
    controller.on('highlight.inner', function(hl) {
      inner.classed('highlighting',
        typeof(hl.x) === 'number' || typeof(hl.y) === 'number');
    });
  })();
  var colormap = colormap(el.select('svg.colormap'), data.matrix, colormapBounds.width, colormapBounds.height);
  var row = !data.rows ? null : dendrogram(el.select('svg.rowDend'), data.rows, false, rowDendBounds.width, rowDendBounds.height, opts.axis_padding, cluster);

  var col = !data.cols ? null : dendrogram(el.select('svg.colDend'), data.cols, true, colDendBounds.width, colDendBounds.height, opts.axis_padding, cluster);
  
  var xax = axisLabels(el.select('svg.xaxis'), data.cols || data.matrix.cols, true, xaxisBounds.width, xaxisBounds.height, opts.axis_padding);
  var yax = axisLabels(el.select('svg.yaxis'), data.rows || data.matrix.rows, false, yaxisBounds.width, yaxisBounds.height, opts.axis_padding);
  
  function colormap(svg, data, width, height) 
  {
    // Check for no data
    if (data.length === 0)
      return function() {};

	if (!opts.show_grid) {
      svg.style("shape-rendering", "crispEdges");
	}
 
    var cols = data.dim[1];
    var rows = data.dim[0];
    
    var merged = data.merged;
    
    var x = d3.scale.linear().domain([0, cols]).range([0, width]);
    var y = d3.scale.linear().domain([0, rows]).range([0, height]);
    var tip = d3.tip()
        .attr('class', 'd3heatmap-tip')
        .html(function(d, i) {
          return "<table>" + 
            "<tr><th align=\"right\">Row</th><td>" + htmlEscape(data.rows[d.row]) + "</td></tr>" +
            "<tr><th align=\"right\">Column</th><td>" + htmlEscape(data.cols[d.col]) + "</td></tr>" +
            "<tr><th align=\"right\">Value</th><td>" + htmlEscape(d.label) + "</td></tr>" +
            "</table>";
        })
        .direction("se")
        .style("position", "fixed");
    
    var brush = d3.svg.brush()
        .x(x)
        .y(y)
        .clamp([true, true])
        .on('brush', function() {
          var extent = brush.extent();
          extent[0][0] = Math.round(extent[0][0]);
          extent[0][1] = Math.round(extent[0][1]);
          extent[1][0] = Math.round(extent[1][0]);
          extent[1][1] = Math.round(extent[1][1]);
          d3.select(this).call(brush.extent(extent));
        })
        .on('brushend', function() {

          if (brush.empty()) {
            controller.transform({
              scale: [1,1],
              translate: [0,0],
              extent: [[0,0],[cols,rows]]
            });
          } else {
            var tf = controller.transform();
            var ex = brush.extent();
            var scale = [
              cols / (ex[1][0] - ex[0][0]),
              rows / (ex[1][1] - ex[0][1])
            ];
            var translate = [
              ex[0][0] * (width / cols) * scale[0] * -1,
              ex[0][1] * (height / rows) * scale[1] * -1
            ];
            controller.transform({scale: scale, translate: translate, extent: ex});
          }
          brush.clear();
          d3.select(this).call(brush).select(".brush .extent")
              .style({fill: opts.brush_color, stroke: opts.brush_color});
        });

    svg = svg
        .attr("width", width)
        .attr("height", height);
    var rect = svg.selectAll("rect").data(merged);
    rect.enter().append("rect").classed("datapt", true)
        .property("colIndex", function(d, i) { return i % cols; })
        .property("rowIndex", function(d, i) { return Math.floor(i / cols); })
        .property("value", function(d, i) { return d.value; })
        .attr("fill", function(d) {
          if (!d.color) {
            return "transparent";
          }
          return d.color;
        });
    rect.exit().remove();
    rect.append("title")
        .text(function(d, i) { return d.label; });
    rect.call(tip);

    var spacing;
    if (typeof(opts.show_grid) === 'number') {
      spacing = opts.show_grid;
    } else if (!!opts.show_grid) {
      spacing = 0.25;
    } else {
      spacing = 0;
    }
    
    //////////// New Code ///////////
    // Calculate at which row index Where the Cluster value changes
    
    current_cluster_value = cluster[0];
    startRow = 0;
    for(var i =0; i < cluster.length; i++)
    {
      if(current_cluster_value !=  cluster[i] )
      {
        cluster_change_rows.push({ylocation:i, cluster:current_cluster_value,
        					 rowInformation:{startRow:startRow , endRow:i-1 }}); // Cluster changes its value at this Y-location .
        current_cluster_value = cluster[i];
        startRow = i;
      }

    }
    // adding information for last cluster.
    cluster_change_rows.push({ylocation: null, cluster:current_cluster_value, rowInformation:{startRow:startRow , endRow:cluster.length-1}})
    //////////////////// End of this calculation.

    function draw(selection) 
    {
      location_object_array = [];
      d3.selectAll("line").remove();
      selection
          .attr("x", function(d, i) {
            return x(i % cols);
          })
          .attr("y", function(d, i) 
          {
            // New Code.
            for(var j =0; j < cluster_change_rows.length; j++)
            {

              if(selection[0][i].rowIndex == cluster_change_rows[j].ylocation)
              {
                        location_object_array.push({begin:null,end:y(Math.floor(i / cols)),
                        					cluster:cluster_change_rows[j].cluster, rowInformation:cluster_change_rows[j].rowInformation});

                        svg.append("line")
                        .attr("x1", 0)
                        .attr("y1", y(Math.floor(i / cols)))
                        .attr("x2", selection[0][i].width.animVal.value* (cols +1))
                        .attr("y2", y(Math.floor(i / cols)))
                        .attr("stroke","black")
                        .attr("stroke-width",1.25)
                        .attr("fill","none");
                 
              }

          }

          // End of line Drawing.
            return y(Math.floor(i / cols));
          })
          .attr("width", (x(1) - x(0)) - spacing)
          .attr("height", (y(1) - y(0)) - spacing);
    }

    draw(rect);

    controller.on('transform.colormap', function(_) {
      x.range([_.translate[0], width * _.scale[0] + _.translate[0]]);
      y.range([_.translate[1], height * _.scale[1] + _.translate[1]]);
      draw(rect.transition().duration(opts.anim_duration).ease("linear"));
    });
    

    var brushG = svg.append("g")
        .attr('class', 'brush')
        .call(brush)
        .call(brush.event);
    brushG.select("rect.background")
        .on("mouseenter", function() {
          tip.style("display", "block");
        })
        .on("mousemove", function() {
          var e = d3.event;
          var offsetX = d3.event.offsetX;
          var offsetY = d3.event.offsetY;
          if (typeof(offsetX) === "undefined") {
            // Firefox 38 and earlier
            var target = e.target || e.srcElement;
            var rect = target.getBoundingClientRect();
            offsetX = e.clientX - rect.left,
            offsetY = e.clientY - rect.top;
          }
          
          var col = Math.floor(x.invert(offsetX));
          var row = Math.floor(y.invert(offsetY));
          var label = merged[row*cols + col].label;
          tip.show({col: col, row: row, label: label}).style({
            top: d3.event.clientY + 15 + "px",
            left: d3.event.clientX + 15 + "px",
            opacity: 0.9
          });
          controller.datapoint_hover({col:col, row:row, label:label});
        })
        .on("mouseleave", function() {
          tip.hide().style("display", "none");
          controller.datapoint_hover(null);
        });

    controller.on('highlight.datapt', function(hl) 
    {
      rect.classed('highlight', function(d, i) {
        return (this.rowIndex === hl.y) || (this.colIndex === hl.x);
      });
    });
  }   // COLOR-MAP ENDS HERE !

  function axisLabels(svg, data, rotated, width, height, padding) 
  {

    svg = svg.append('g');

    // The data variable is either cluster info, or a flat list of names.
    // If the former, transform it to simply a list of names.
    var leaves;
    if (data.children) 
    {
      leaves = d3.layout.cluster().nodes(data)
          .filter(function(x) { return !x.children; })
          .map(function(x) { return x.label + ""; });
    } 
    else if (data.length) 
    {
      leaves = data;
    }
    
    // Define scale, axis
    var scale = d3.scale.ordinal()
        .domain(leaves)
        .rangeBands([0, rotated ? width : height]);
    var axis = d3.svg.axis()
        .scale(scale)
        .orient(rotated ? "bottom" : "right")
        .outerTickSize(0)
        .tickPadding(padding)
        .tickValues(leaves);

    // Create the actual axis
    var axisNodes = svg.append("g")
        .attr("transform", rotated ? "translate(0," + padding + ")" : "translate(" + padding + ",0)")
        .call(axis);
    var fontSize = opts[(rotated ? 'x' : 'y') + 'axis_font_size']
        || Math.min(18, Math.max(9, scale.rangeBand() - (rotated ? 11: 8))) + "px";
    axisNodes.selectAll("text").style("font-size", fontSize);
    
    var mouseTargets = svg.append("g")
      .selectAll("g").data(leaves);
    mouseTargets
      .enter()
        .append("g").append("rect")
          .attr("transform", rotated ? "rotate(45),translate(0,0)" : "")
          .attr("fill", "transparent")
          .on("click", function(d, i) {
            var dim = rotated ? 'x' : 'y';
            var hl = controller.highlight() || {x:null, y:null};
            if (hl[dim] == i) {
              // If clicked already-highlighted row/col, then unhighlight
              hl[dim] = null;
              controller.highlight(hl);
            } else {
              hl[dim] = i;
              controller.highlight(hl);
            }
            d3.event.stopPropagation();
          });
    function layoutMouseTargets(selection) {
      selection
          .attr("transform", function(d, i) {
            var x = rotated ? scale(d) + scale.rangeBand()/2 : 0;
            var y = rotated ? padding + 6 : scale(d);
            return "translate(" + x + "," + y + ")";
          })
        .selectAll("rect")
          .attr("height", scale.rangeBand() / (rotated ? 1.414 : 1))
          .attr("width", rotated ? height * 1.414 * 1.2 : width);
    }
    layoutMouseTargets(mouseTargets);

    if (rotated) {
      axisNodes.selectAll("text")
        .attr("transform", "rotate(45),translate(6, 0)")
        .style("text-anchor", "start");
    }
    
    controller.on('highlight.axis-' + (rotated ? 'x' : 'y'), function(hl) {
      var ticks = axisNodes.selectAll('.tick');
      var selected = hl[rotated ? 'x' : 'y'];
      if (typeof(selected) !== 'number') {
        ticks.classed('faded', false);
        return;
      }
      ticks.classed('faded', function(d, i) {
        return i !== selected;
      });
    });

    controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function(_) {
      var dim = rotated ? 0 : 1;
      //scale.domain(leaves.slice(_.extent[0][dim], _.extent[1][dim]));
      var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]];
      scale.rangeBands(rb);
      var tAxisNodes = axisNodes.transition().duration(opts.anim_duration).ease('linear');
      tAxisNodes.call(axis);
      // Set text-anchor on the non-transitioned node to prevent jumpiness
      // in RStudio Viewer pane
      axisNodes.selectAll("text").style("text-anchor", "start");
      tAxisNodes.selectAll("g")
          .style("opacity", function(d, i) {
            if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
              return 1;
            } else {
              return 0;
            }
          });
      tAxisNodes
        .selectAll("text")
          .style("text-anchor", "start");
      mouseTargets.transition().duration(opts.anim_duration).ease('linear')
          .call(layoutMouseTargets)
          .style("opacity", function(d, i) {
            if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
              return 1;
            } else {
              return 0;
            }
          });
    });

  }
  
  function edgeStrokeWidth(node) 
  {
    if (node.edgePar && node.edgePar.lwd)
      return node.edgePar.lwd;
    else
      return 1;
  }
  
  function maxChildStrokeWidth(node, recursive) 
  {
    var max = 0;
    for (var i = 0; i < node.children.length; i++) 
    {
      if (recursive) 
      {
        max = Math.max(max, maxChildStrokeWidth(node.children[i], true));
      }
      max = Math.max(max, edgeStrokeWidth(node.children[i]));
    }
    return max;
  }
  

// New function
function string_parser(string_array,location_object_array, pointer, id)
{
  var correspondingString ="(";
  var last2Elements=[];
	var table = [];
	while (pointer < string_array.length)
	{
		if (string_array[pointer] == "(")
		{
			result = string_parser(string_array,location_object_array, pointer + 1, id);
			sub_table = result[0];
			pointer = result[1];
			id = result[2];
      correspondingString = correspondingString + result[3];
      // PUT SOMETHING HERE ALSO FOR CORRESPONDING STRINGS.
			table = table.concat(sub_table);
			last2Elements.push(sub_table[sub_table.length-1]);
		}
		else if (string_array[pointer] == ")")
		{
			// At this point you must have only two OBJCTS in the table. 
			// combine them and make a new object from them and push them into the table
			// then retrun to the previous recursion level.
			

      correspondingString = correspondingString + string_array[pointer];
			// ADD the sibling information.

			for(var i=0; i <table.length; i++){
				if(table[i].character == last2Elements[0].character){
					table[i].sibling = last2Elements[1];
				}
				if(table[i].character ==last2Elements[1].character){
					table[i].sibling = last2Elements[0];
				}
			}
			last2Elements[0].sibling = last2Elements[1];
			last2Elements[1].sibling = last2Elements[0];
 			// ADDED
			
			var sum = 0;
			var new_character = "";
			var children = [];
			if(last2Elements.length == 0)
			{
				for(var j=table.length-2 ; j<= table.length-1; j++)
				{
					sum = sum + table[j].location.vertical;
					new_character = new_character+table[j].character;
					children.push(table[j]);
				}
			}
			else // Will this always be true ?? Verify ! Because last 2 elements  will always have tw
			{
				for(var j=0; j<=last2Elements.length-1;j++)
				{
					sum = sum + last2Elements[j].location.vertical;
					new_character = new_character+last2Elements[j].character;
					children.push(last2Elements[j]);
				}
			}
			mid_point = sum/2;
			// Find out how many characters does the string have, that way, we will be able to find the horizontal location of the 
			// object.
			var horizontal = (new_character.length-1) * 5;
			var location = { horizontal: horizontal, vertical: mid_point};
			var rowStart = last2Elements[0].rowLocationInformation.startRow;
			var rowEnd = last2Elements[1].rowLocationInformation.endRow;
			table.push({character: new_character, location: location, children: children, id:id,
						rowLocationInformation:{startRow: rowStart, endRow:rowEnd}, sibling:null, correspondingString: correspondingString});
			id = id+1;



			return [table, pointer+1,id, correspondingString];
		}
		else if(string_array[pointer] == ",")
		{
			// Do nothing;
      correspondingString = correspondingString + string_array[pointer];
			pointer = pointer + 1;
		}
		else // The object is a cluster number
		{
			var vertical = 0;
      correspondingString = correspondingString + string_array[pointer];
			var rowLocationInformation ;
			for(var j in location_object_array){
				if (string_array[pointer] == parseInt(location_object_array[j].cluster))
				{
					vertical = (location_object_array[j].begin + location_object_array[j].end ) /2;
					rowLocationInformation = location_object_array[j].rowInformation;
				}
			}
			var location = {horizontal: 0, vertical: vertical};
			table.push({character:string_array[pointer] , location: location, children: null, id:id, 
          rowLocationInformation:rowLocationInformation, sibling: null, correspondingString: string_array[pointer]});
			last2Elements.push({character:string_array[pointer] , location: location, children: null, id:id,
          rowLocationInformation:rowLocationInformation, sibling: null, correspondingString: string_array[pointer]});
			pointer = pointer + 1;
			id = id +1;
		}
		
	}
	// Adding ID's for each object to be used later by the onClick and onHover function. (i dont understand ?)
return table;


}
// New Function
function drawLines(table, links1)
{
	var links1Counter = 0;
	for (var i in table)
	{
		if (table[i].children != null )
		{
			for (var j in table[i].children)
			{
     			links1[links1Counter].source.x = table[i].location.vertical;
     			links1[links1Counter].source.y = table[i].location.horizontal;
    			links1[links1Counter].target.x = table[i].children[j].location.vertical;
  				links1[links1Counter].target.y = table[i].children[j].location.horizontal;
  				links1[links1Counter].line_name = table[i].children[j].character;
  				links1[links1Counter].siblingLineName = table[i].children[j].sibling.character;
  				links1[links1Counter].rowRange = table[i].children[j].rowLocationInformation;
  				links1[links1Counter].siblingRowRange = table[i].children[j].sibling.rowLocationInformation;
          links1[links1Counter].correspondingString = table[i].children[j].correspondingString;
          links1[links1Counter].siblingCorrespondingString = table[i].children[j].sibling.correspondingString;
  				links1Counter ++;
			}
		}
	}
	return links1;
}



  function dendrogram(svg, data, rotated, width, height, padding, cluster_array)
  {
    var topLineWidth = maxChildStrokeWidth(data, false);
    
   
    var x = d3.scale.linear()
        .domain([data.height, 0])
        .range([topLineWidth/2, width-padding]); 
    var y = d3.scale.linear()
        .domain([0, height])
        .range([0, height]);	
    
    var cluster = d3.layout.cluster()	// D3 tool for Cluster
        .separation(function(a, b) { return 1; })
        .size([rotated ? width : height, NaN]);
    
    var transform = "translate(1,0)";
    if (rotated) {
      // Flip dendrogram vertically
      x.range([topLineWidth/2, -height+padding+2]);
      // Rotate
      transform = "rotate(-90) translate(-2,0)";
    }

    var dendrG = svg
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", transform); 	//Creating the SVG Element

    var nodes = cluster.nodes(data);
   //			 nodes.splice(4,nodes.length); // 4 should be replaced by the number of clusters - 1
    var links = cluster.links(nodes);  
    

    // I'm not sure why, but after the heatmap loads the "links"
    // array mutates to much smaller values. I can't figure out
    // what's doing it, so instead we just make a deep copy of
    // the parts we want.
    var links1 = links.map(function(link, i) 
    {
      return {
        source: {x: 0, y: 0},
        target: {x: 0, y: 0}, 
        edgePar: link.target.edgePar,
        line_name: "",
        siblingLineName:null,
        rowRange:null,
        siblingRowRange:null,
        correspondingString:null,
        siblingCorrespondingString:null

      };
    });


///////////////////// ****************** Some New experimental TESTING CODE ****
  //Refine Location Object Array
  for(i=0; i<location_object_array.length; i++)
  {
    location_object_array[i].end = location_object_array[i].end;
    location_object_array.splice(i+1,number_of_columns);
  }
  location_object_array.push({begin:null, end: height,cluster:cluster_array[cluster_array.length-1],
   			rowInformation:cluster_change_rows[cluster_change_rows.length-1].rowInformation}); // add the information for the last array
  location_object_array[0].begin = 0;
  for(i=1; i<location_object_array.length; i++ )
  {
    location_object_array[i].begin = location_object_array[i-1].end;
  }
  // Refinment Done.
  var  table = string_parser(dend_row_newick_format.split(""), location_object_array, 0, 0);
  var links1 = drawLines(table, links1); // NOW DRAW THE LINES ACCORDING TO THE INFORMATION IN table. 
////////////////////////////////////////////////////////// *****************  New Code ends here  ******** 
   
    lines = dendrG.selectAll("polyline").data(links1); // GOLABAL !!! CAAREFULL
    lines
      .enter().append("polyline")
        .attr("class", "link")
        .attr("stroke", "#A2A2A2")
        .attr("stroke-width", "1.5")
        .attr("stroke-dasharray", function(d, i) {
          var pattern;
          switch (d.edgePar.lty) {
            case 6:
              pattern = [3,3,5,3];
              break;
            case 5:
              pattern = [15,5];
              break;
            case 4:
              pattern = [2,4,4,4];
              break;
            case 3:
              pattern = [2,4];
              break;
            case 2:
              pattern = [4,4];
              break;
            case 1:
            default:
              pattern = [];
              break;
          }
          for (var i = 0; i < pattern.length; i++) 
          {
            pattern[i] = pattern[i] * (d.edgePar.lwd || 1);
          }
          return pattern.join(",");
        })
        .on("mouseover",function(d,i){
        								console.log(i);
        								console.log(d);	
										d3.select(this)
										.style("cursor", "pointer")
										.style("stroke", "blue")
										.attr("stroke-width", "2.5");
										// Turn all the children Blue.
										for(var j=0;j<table.length;j++)
										{
											if(d.line_name.indexOf(links1[j].line_name) > -1 )
											{
												d3.select(lines[0][j])
												.style("stroke","blue")
												.attr("stroke-width", "2.5");
											}
											if(d.siblingLineName.indexOf(links1[j].line_name) > -1)
											{
												d3.select(lines[0][j])
												.style("stroke","red")
												.attr("stroke-width", "2.5");
											}
										}




       	 							})
        .on("mouseout", function(d,i){
        								d3.select(this)
        								.style("stroke", "#A2A2A2")
        								.attr("stroke-width", "1.5");

        								for(var j=0;j<table.length;j++)
										{
											if(d.line_name.indexOf(links1[j].line_name) > -1 )
											{
												d3.select(lines[0][j])
												.style("stroke","#A2A2A2")
												.attr("stroke-width", "1.5");
											}
											if(d.siblingLineName.indexOf(links1[j].line_name) > -1 )
											{
												d3.select(lines[0][j])
												.style("stroke","#A2A2A2")
												.attr("stroke-width", "1.5");
											}
										}

        							})
        ;


    function draw(selection) 
    {
      svg.selectAll("line").remove();

      function elbow(d, i) 
      {
   
        return x(d.source.y) + "," + y(d.source.x) + " " + x(d.source.y) + "," + y(d.target.x) + " " + x(d.target.y) + "," + y(d.target.x);
      }
      selection
          .attr("points", elbow);
    }

    controller.on('transform.dendr-' + (rotated ? 'x' : 'y'), function(_) 
    {
      var scaleBy = _.scale[rotated ? 0 : 1];
      var translateBy = _.translate[rotated ? 0 : 1];
      y.range([translateBy, height * scaleBy + translateBy]);
      draw(lines.transition().duration(opts.anim_duration).ease("linear"));
    });

    draw(lines);
  } // DendoGram function ends here.

 
  var dispatcher = d3.dispatch('hover', 'click');
  
  controller.on("datapoint_hover", function(_) 
  {
    dispatcher.hover({data: _});
  });
  
  // I don;t see a use of these functions 
  // ----------------------------------
  function on_col_label_mouseenter(e) {
    controller.highlight(+d3.select(this).attr("index"), null);
  }
  function on_col_label_mouseleave(e) {
    controller.highlight(null, null);
  }
  function on_row_label_mouseenter(e) {
    controller.highlight(null, +d3.select(this).attr("index"));
  }
  function on_row_label_mouseleave(e) {
    controller.highlight(null, null);
  }
  /// ---------------------------------

  return [{
    on: function(type, listener) {
      dispatcher.on(type, listener);
      return this;
    }
  }, lines];
}
