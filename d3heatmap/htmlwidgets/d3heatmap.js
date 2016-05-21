HTMLWidgets.widget({
  name: 'd3heatmap',

  type: 'output',

  initialize: function(el, width, height) {

    return {
      lastTheme: null,
      lastValue: null
    };

  },
  
  renderValue: function(el, x, instance) 
  {
    newWickString = "(((1,2),(3,4)),5)";   // Temporary Solution
    this.doRenderValue(el, x, newWickString, instance,null);
  },

  // Need dedicated helper function that can be called by both renderValue
  // and resize. resize can't call this.renderValue because that will be
  // routed to the Shiny wrapper method from htmlwidgets, which expects the
  // wrapper data object, not x.
  doRenderValue: function(el, x, newWickString, instance, newMerged) 
  {
    var self = this;
    
    instance.lastValue = x;
    
    if (instance.lastTheme && instance.lastTheme != x.theme) {
      d3.select(document.body).classed("theme-" + instance.lastTheme, false);
    }
    if (x.theme) {
      d3.select(document.body).classed("theme-" + x.theme, true);
    }

    el.innerHTML = "";
    
    this.loadImage(x.image, function(imgData, w, h) 
    {
      
      if (w !== x.matrix.dim[0] || h !== x.matrix.dim[1]) {
        throw new Error("Color dimensions didn't match data dimensions")
      }
      
      var merged = [];
      for (var i = 0; i < x.matrix.data.length; i++) {
        var r = imgData[i*4];
        var g = imgData[i*4+1];
        var b = imgData[i*4+2];
        var a = imgData[i*4+3];
        merged.push({
          label: x.matrix.data[i],
          color: "rgba(" + [r,g,b,a/255].join(",") + ")"
        })
      }
      if(newMerged == null)
      {
      x.matrix.merged = merged;
      }
      else
      {
        x.matrix.merged = newMerged;
      }
      //console.log(JSON.stringify({merged: x.matrix.merged}, null, "  "));

      var test = heatmap(el, x, newWickString,  x.options)
      var hm = test[0];
      var numair = test[1];

      numair.on("click", function(d,i)
                                      {
                                        console.log("you clicked a line");
                                        console.log(i);
                                        console.log(d);
                                        self.refreshData(d,el,x,newWickString,instance);
                                        
                                      });
      //hm.on('hover', function(e) {el.innerHTML = "Puff !";});
      
      
      if (window.Shiny) {
        var id = self.getId(el);
        hm.on('hover', function(e) {
          Shiny.onInputChange(id + '_hover', !e.data ? e.data : {
            label: e.data.label,
            row: x.matrix.rows[e.data.row],
            col: x.matrix.cols[e.data.col]
          });
        });
        /* heatmap doesn't currently send click, since it means zoom-out
        hm.on('click', function(e) {
          Shiny.onInputChange(id + '_click', !e.data ? e.data : {
            label: e.data.label,
            row: e.data.row + 1,
            col: e.data.col + 1
          });
        });
        */
  	  }
    });
  },

  resize: function(el, width, height, instance) {
    if (instance.lastValue) {
      newWickString = "(((1,2),(3,4)),5)";  // Temporary Solution
      this.doRenderValue(el, instance.lastValue,newWickString, instance,null);
    }
  },
  
  loadImage: function(uri, callback) {
    var img = new Image();
    img.onload = function() {
      // Save size
      w = img.width;
      h = img.height;

      // Create a dummy canvas to extract the image data
      var imgDataCanvas = document.createElement("canvas");
      imgDataCanvas.width = w;
      imgDataCanvas.height = h;
      imgDataCanvas.style.display = "none";
      document.body.appendChild(imgDataCanvas);

      var imgDataCtx = imgDataCanvas.getContext("2d");
      imgDataCtx.drawImage(img, 0, 0);

      // Save the image data.
      imgData = imgDataCtx.getImageData(0, 0, w, h).data;

      // Done with the canvas, remove it from the page so it can be gc'd.
      document.body.removeChild(imgDataCanvas);
      
      callback(imgData, w, h);
    };
    img.src = uri;
  },


  refreshData: function(d,el,x,newWickString,instance){
    // Determine which line is clicked, which cluster does it reperesnt,
    // what is that start and end location of the are which it represents
    // and what is the start and end of the area represented by its sibling.
    var clusterSwapArray_1 = x.owncluster.list.slice(d.rowRange.startRow, d.rowRange.endRow+1);
    var clusterSwapArray_2 = x.owncluster.list.slice(d.siblingRowRange.startRow, d.siblingRowRange.endRow+1);
    var matrixDataArray_1 = x.matrix.data.slice(d.rowRange.startRow * x.matrix.cols.length, ((d.rowRange.endRow+1)*x.matrix.cols.length));
    var matrixDataArray_2 = x.matrix.data.slice(d.siblingRowRange.startRow*x.matrix.cols.length, (d.siblingRowRange.endRow+1)*x.matrix.cols.length);
    var matrixMergeArray_1 = x.matrix.merged.slice(d.rowRange.startRow * x.matrix.cols.length, ((d.rowRange.endRow+1)*x.matrix.cols.length));
    var matrixMergeArray_2  = x.matrix.merged.slice(d.siblingRowRange.startRow*x.matrix.cols.length, (d.siblingRowRange.endRow+1)*x.matrix.cols.length);

    // ownClusterCounter should always start with the smaller rowIndex (d.rowRange.startRow,d.siblingRowRange.startRow)
    ownClusterCounter = d.rowRange.startRow < d.siblingRowRange.startRow ? d.rowRange.startRow : d.siblingRowRange.startRow;
    matrixDataCounter = d.rowRange.startRow < d.siblingRowRange.startRow ? d.rowRange.startRow *  x.matrix.cols.length : d.siblingRowRange.startRow * x.matrix.cols.length;
    matrixMergeCounter = d.rowRange.startRow < d.siblingRowRange.startRow ? d.rowRange.startRow *  x.matrix.cols.length : d.siblingRowRange.startRow * x.matrix.cols.length;
    if(d.rowRange.startRow > d.siblingRowRange.startRow) // If the line clicked is the lower sibling
    {
      { // Swap the Cluster Array
              for(var i=0; i<clusterSwapArray_1.length; i++)
              {
                x.owncluster.list[ownClusterCounter] = clusterSwapArray_1[i];
                ownClusterCounter++;
              }

              for(var i=0; i<clusterSwapArray_2.length;i++)
              {
                  x.owncluster.list[ownClusterCounter] = clusterSwapArray_2[i];
                  ownClusterCounter++;
              }
      }

      {// Swap the Matrix Data array + Swap the Merged Data
              for(var i=0; i<matrixDataArray_1.length; i++)
              {
                  x.matrix.data[matrixDataCounter] = matrixDataArray_1[i];
                  x.matrix.merged[matrixMergeCounter] = matrixMergeArray_1[i];
                  matrixDataCounter++;
                  matrixMergeCounter++;
              }

              for(var i=0; i<matrixDataArray_2.length; i++)
              {
                  x.matrix.data[matrixDataCounter] = matrixDataArray_2[i];
                  x.matrix.merged[matrixMergeCounter] = matrixMergeArray_2[i];
                  matrixDataCounter++;
                  matrixMergeCounter++;
              }
      }

    }
    else // If the line clicked is the upper sibling.
    {
      { // Swap the Cluster Array
            for(var i=0; i<clusterSwapArray_2.length;i++)
            {
              x.owncluster.list[ownClusterCounter] = clusterSwapArray_2[i];
              ownClusterCounter++;
            }
            for(var i = 0; i<clusterSwapArray_1.length;i++)
            {
              x.owncluster.list[ownClusterCounter] = clusterSwapArray_1[i];
              ownClusterCounter++;
            }
      }

      { // Swap the Matrix Data array + swap the merged Data.

            for(var i=0; i<matrixDataArray_2.length; i++)
            {
              x.matrix.data[matrixDataCounter] = matrixDataArray_2[i];
              x.matrix.merged[matrixMergeCounter] = matrixMergeArray_2[i];
              matrixDataCounter++;
              matrixMergeCounter++;
            }
            for(var i=0; i<matrixDataArray_1.length; i++)
            {
              x.matrix.data[matrixDataCounter] = matrixDataArray_1[i];
              x.matrix.merged[matrixMergeCounter] = matrixMergeArray_1[i];
              matrixDataCounter++;
              matrixMergeCounter++;
            }

      }
    }

    // Refreshing the newick String.
    {
          var clickedString = d.correspondingString;
          var siblingString = d.siblingCorrespondingString;
          newWickString = newWickString.replace(clickedString,"clicked");
          newWickString = newWickString.replace(siblingString,"sibling");
          newWickString = newWickString.replace("clicked",siblingString);
          newWickString = newWickString.replace("sibling",clickedString);
    }



    this.doRenderValue(el,x,newWickString,instance, x.matrix.merged); // Recall the function here with new data values.
  }

});
