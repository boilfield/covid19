(function(d3) {
  'use strict';

  var width = 260;
  var height = 160;
  var radius = Math.min(width, height) / 2;
  var donutWidth = 35;
  var legendRectSize = 18;
  var legendSpacing = 4;


  //fill color

  var color = d3.scaleOrdinal(d3.schemeCategory20b);


  var svg = d3.select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + radius + ',' + radius + ')');


  var arc = d3.arc()
    .innerRadius(radius - donutWidth)
    .outerRadius(radius);

  var pie = d3.pie()
    .value(function(d) { return d.count; })
    .sort(null);

  var tooltip = d3.select('#chart')
    .append('div')
    .attr('class', 'tooltip');
  
  tooltip.append('svg').append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)                                   
      .style('fill', color)
      .style('stroke', color);
  

  tooltip.append('div')
    .attr('class', 'color');

  tooltip.append('div')
    .attr('class', 'label');

  tooltip.append('div')
    .attr('class', 'count');

  tooltip.append('div')
    .attr('class', 'percent');

  d3.csv('https://docs.google.com/spreadsheets/d/e/2PACX-1vQg6S_03R2ynngPlnguRyaocWm1Xay7LpVo_HGTNrHkExYjViIvZDxepMuVw6YYvXIlF6n3cF-22BVT/pub?gid=0&single=true&output=csv', function(error, dataset) {
    dataset.forEach(function(d) {
      d.count = +d.count;
      d.enabled = true;                                         // NEW
    });



  var path = svg.selectAll('path')
            .data(pie(dataset))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', function(d, i) { 
              return color(d.data.label); 
            });

          path.on('mouseover', function(d) {                            // NEW
            var total = d3.sum(dataset.map(function(d) {                // NEW
              return d.count;                                           // NEW
            }));                                                        // NEW
            var percent = Math.round(1000 * d.data.count / total) / 10; // NEW
            tooltip.select('.label').html(d.data.label);                // NEW
            tooltip.select('.count').html(d.data.count);                // NEW
            tooltip.select('.percent').html(percent + '%');             // NEW
            tooltip.style('display', 'block');                          // NEW
          });                                                           // NEW
          
          path.on('mouseout', function() {                              // NEW
            tooltip.style('display', 'none');                           // NEW
          });                                                           // NEW

    // var path = svg.selectAll('path')
    //   .data(pie(dataset))
    //   .enter()
    //   .append('path')
    //   .attr('d', arc)
    //   .attr('fill', function(d, i) { 
    //     return color(d.data.label); 
    //   })                                                        // UPDATED (removed semicolon)
    //   .each(function(d) { this._current = d; });                // NEW

    // path.on('mouseover', function(d) {
    //   var total = d3.sum(dataset.map(function(d) {
    //     return (d.enabled) ? d.count : 0;                       // UPDATED
    //   }));
    //   var percent = Math.round(1000 * d.data.count / total) / 10;
    //   tooltip.select('.label').html(d.data.label);
    //   tooltip.select('.count').html(d.data.count); 
    //   tooltip.select('.percent').html(percent + '%'); 
    //   tooltip.style('display', 'block');
    //   tooltip.select('.color')
    //     .style('background-color', color(d.data.label))
    // });
    
    // path.on('mouseout', function() {
    //   tooltip.style('display', 'none');
    // });

     
    // path.on('mousemove', function(d) {
    //   tooltip.style('top', (d3.event.pageY +10) + 'px')
    //     .style('right', (d3.event.pageX + 30) + 'px');
    // });
    
      
    var legend = svg.selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d, i) {
        var rectHeight = legendRectSize + legendSpacing;
        var offset =  rectHeight * color.domain().length / 2;
        var horz =  radius + legendRectSize; //-2 * legendRectSize;
        var vert = i * rectHeight - offset;
        return 'translate(' + horz + ',' + vert + ')';
      });

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)                                   
      .style('fill', color)
      .style('stroke', color)                                   // UPDATED (removed semicolon)
      .on('click', function(label) {                            // NEW
        var rect = d3.select(this);                             // NEW
        var enabled = true;                                     // NEW
        var totalEnabled = d3.sum(dataset.map(function(d) {     // NEW
          return (d.enabled) ? 1 : 0;                           // NEW
        }));                                                    // NEW
        
        if (rect.attr('class') === 'disabled') {                // NEW
          rect.attr('class', '');                               // NEW
        } else {                                                // NEW
          if (totalEnabled < 2) return;                         // NEW
          rect.attr('class', 'disabled');                       // NEW
          enabled = false;                                      // NEW
        }                                                       // NEW

        pie.value(function(d) {                                 // NEW
          if (d.label === label) d.enabled = enabled;           // NEW
          return (d.enabled) ? d.count : 0;                     // NEW
        });                                                     // NEW

        path = path.data(pie(dataset));                         // NEW

        path.transition()                                       // NEW
          .duration(750)                                        // NEW
          .attrTween('d', function(d) {                         // NEW
            var interpolate = d3.interpolate(this._current, d); // NEW
            this._current = interpolate(0);                     // NEW
            return function(t) {                                // NEW
              return arc(interpolate(t));                       // NEW
            };                                                  // NEW
          });                                                   // NEW
      });                                                       // NEW
      
    legend.append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function(d) { return d; });

  });



   // append text
  g.append("text")
    .transition()
      .ease(d3.easeLinear)
      .duration(2000)
    .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .text(function(d) { return d.data.label;});

})(window.d3);