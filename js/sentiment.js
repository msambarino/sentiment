function sentimentChart(){
  var width = 950;
  var height = 600;
  var exponent = 5;
  var range = [2,40];
  var buildColorKey = true;
  var buildScaleKey = true;
  var neutrals_on = [];
  var neutrals_off = [];
  var center = {
        x: width / 2,
        y: height / 2
      };
  var svg;

  //D3 Settings
  //radius scale - Domain and range are set later when max and min klout value can be obtained.
  var rScale = d3.scale.pow().exponent(exponent);
  var defaultGravity = 0.1;
  var defaultCharge = function(d){ return -Math.pow(d.radius, 2.0) / 8};
  
  //Color scale - Assigns color to each sentiment rate (from very negative to very positive)
  var fillColor = d3.scale.ordinal().domain([-1,0,1]).range(["#FB0106", "#3487BE", "#4EC208"]);
  var strokeColor = d3.scale.ordinal().domain([-1,0,1]).range(["#BB0104", "#2D75A4", "#44A807"]);
  
  
  //Tooltip
  var tooltip = CustomTooltip("sentiment_tooltip", 140);
  
  //Function to build and show details of a sentiment node as a tooltip.
  var show_details = function(data, i, element){
    d3.select(element).attr("stroke", "black");
    var content = "<img src=\"" + data.url + "\" height=\"40\" width=\"40\"></img><br/>";
    content += "<span class=\"name\">Name:</span><span class=\"value\"> @" + data.name + "</span><br/>";
    content += "<span class=\"name\">Followers:</span><span class=\"value\"> " + data.followers + "</span><br/>";
    content += "<span class=\"name\">Following:</span><span class=\"value\"> " + data.following + "</span><br/>";
    content += "<span class=\"name\">Klout:</span><span class=\"value\"> " + data.klout + "</span><br/>";
    tooltip.showTooltip(content,d3.event);
  }

  //Function to hide tooltip for a given sentiment node.
  var hide_details = function(data, i, element){
    d3.select(element).attr("stroke", function(d){ return strokeColor(d.rate)});
    tooltip.hideTooltip();
  }
  
   var moveTowardsCenter = function(alpha) {
        return function(d){
          d.y = d.y + (center.y - d.y) * (defaultGravity + 0.02) * alpha
          d.x = d.x + (center.x - d.x) * (defaultGravity + 0.02) * alpha
        };
      };
      
      /*Pulls bubbles to the appropriate height according to its sentiment rate. 
       - Very negative bubbles go towards the bottom
       - Very positive bubbles go towards the top
      */
      var buoyancy = function(alpha) {
        return function(d){
          var targetY = rateY(d.rate);
          var targetX = center.x - Math.pow(0.2,d.rate) * 10;
          d.x = d.x + (targetX - d.x) * defaultGravity  * alpha * alpha * alpha * 50;
          d.y = d.y + (targetY - d.y) * defaultGravity * alpha * alpha * alpha * 180;
        };
      };
      
      var rateY = function(rate){
        return center.y - rate * 50;
      };
  
  
  //Builds the sentiment sphere.
  function chart(selection){
    selection.each(function(sentiment_data){
      var data_neutrals_on = sentiment_data.data.neutrals_on.nodes;
      var data_neutrals_off = sentiment_data.data.neutrals_off.nodes;
      var center = {
        x: width / 2,
        y: height / 2
      }
      
      //Min and max influence score. Used to adjust the radius scale for the sentiment bubbles.
      //Influence of a sentiment node is given by its klout score.
      var maxScore = d3.max(data_neutrals_on, function(d){ return d.klout; });
      var minScore = d3.min(data_neutrals_on, function(d){ return d.klout; });
      
      rScale.domain([minScore, maxScore]).range(range)
      //Pulls bubbles to the center.

      
      //Builds the sentiment nodes.
      neutrals_on = data_neutrals_on.map(function(d, i){
        return {
          id: d.id,
          sentiment: d.sentiment,
          followers: d.followers,
          following: d.following,
          url: d.url,
          name: d.username,
          klout: d.klout,
          radius: rScale(d.klout),
          rate: d.rate,
          x: Math.random() * width,
          y: height - d.rate * 100
        };
      });
      
      neutrals_off = data_neutrals_off.map(function(d, i){
        return {
          id: d.id,
          sentiment: d.sentiment,
          followers: d.followers,
          following: d.following,
          url: d.url,
          name: d.username,
          klout: d.klout,
          radius: rScale(d.klout),
          rate: d.rate,
          x: Math.random() * width,
          y: height - d.rate * 100
        };
      });
      
      //Sorts nodes according to sentiment
      neutrals_on.sort(function(a, b){ return b.sentiment - a.sentiment;});
      neutrals_off.sort(function(a, b){ return b.sentiment - a.sentiment;});
      
      //`this` refers to the element that was selected to call this chart.
      //Appends the svg element where the sentiment bubbles will be drawn.
      svg = d3.select(this).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class","sentiment-chart");
      
      var circles = svg.selectAll("circle").data(neutrals_on, function(d){ return d.id; });
      
      
      circles.enter().append("circle")
        .attr("r", 0)
        .attr("fill", function(d){ return fillColor(d.rate)})
        .attr("stroke-width", 1)
        .attr("stroke", function(d){ return strokeColor(d.rate)})
        .attr("id", function(d){ return "bubble_#{d.id}" })
        .on("mouseover", function(d,i){ return show_details(d,i,this);})
        .on("mouseout", function(d,i){ return hide_details(d,i,this);})
      
      var force = d3.layout.force()
        .nodes(neutrals_on)
        .size([width,height])
        .gravity(0.01)
        .charge(defaultCharge)
        .friction(0.9)
        .on("tick", function(e){
          circles
            .each(moveTowardsCenter(e.alpha))
            .each(buoyancy(e.alpha))
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        });
      force.start();
      circles.transition()
        .duration(2000)
        .attr("r", function(d){return d.radius});
        
      
      //
      if(buildScaleKey){
        //Build the scale key
        
        var key = d3.select("#scaleKey").append("svg")
          .attr("width", 220)
          .attr("height",110)
        
        var maxRadius = range[1];
        var cx = maxRadius;
        var textX = cx + maxRadius + 25;

        //100 klout circle
        var cy100 = maxRadius + 5;
        //console.log(cy100);

        key.append("circle")
          .attr('r', maxRadius)
          .attr('class',"scaleKeyCircle")
          .attr('cx', cx)
          .attr('cy', cy100);
        key.append("text")
          .attr("x", textX)
          .attr("y", cy100 - maxRadius + 2.5)
          .attr("class", "scaleKeyText")
          .text("Influencia Alta");
        key.append("path")
          .attr("d", "M "+cx+" "+(cy100 - maxRadius)+" L "+ (textX - 5) +" "+ (cy100 - maxRadius))
          .attr("class","scaleKeyStroke");

        //50 klout circle
        var midRadius = maxRadius / 2;
        var cy50 = cy100 + maxRadius - midRadius;
        key.append("circle")
          .attr('r', midRadius)
          .attr('class',"scaleKeyCircle")
          .attr('cx', cx)
          .attr('cy', cy50);
        key.append("text")
          .attr("x", textX)
          .attr("y", cy50 - midRadius + 2.5)
          .attr("class", "scaleKeyText")
          .text("Influencia Media");
        key.append("path")
          .attr("d", "M "+cx+" "+ (cy50 - midRadius)+" L "+ (textX - 5) +" "+ (cy50 - midRadius))
          .attr("class","scaleKeyStroke");

        //20 klout circle
        var lowRadius = maxRadius / 10;
        var cy20 = cy100 + maxRadius - lowRadius - 1;
        key.append("circle")
          .attr('r', lowRadius)
          .attr('class',"scaleKeyCircle")
          .attr('cx', cx)
          .attr('cy', cy20);
        key.append("text")
          .attr("x", textX)
          .attr("y", cy20 - lowRadius + 2.5)
          .attr("class", "scaleKeyText")
          .text("Influencia Baja")
        key.append("path")
          .attr("d", "M "+cx+" "+(cy20 - lowRadius)+" L "+ (textX - 5) +" "+ (cy20 - lowRadius))
          .attr("class","scaleKeyStroke"); 
      }
      
      if(buildColorKey){
        //Build the color key
        
        var key = d3.select("#colorKey").append("svg")
          .attr("width", 220)
          .attr("height",110)
        
        key.append("circle")
          .attr("r", 10)
          .attr("cx", 20)
          .attr("cy", 20)
          .attr("class","colorKeyPositive");
        
        key.append("text")
          .attr("x", 45)
          .attr("y", 25)
          .attr("class", "colorKeyText")
          .text("Positivo: "+sentiment_data.neutrals_on.rate_percentages.positivo+"%");
        
        key.append("circle")
          .attr("r", 10)
          .attr("cx", 20)
          .attr("cy", 50)
          .attr("class","colorKeyNeutral");
        
        key.append("text")
          .attr("x", 45)
          .attr("y", 55)
          .attr("class", "colorKeyText")
          .text("Neutral: "+sentiment_data.neutrals_on.rate_percentages.neutral+"%");
        
        key.append("circle")
          .attr("r", 10)
          .attr("cx", 20)
          .attr("cy", 80)
          .attr("class","colorKeyNegative");
        
        key.append("text")
          .attr("x", 45)
          .attr("y", 85)
          .attr("class", "colorKeyText")
          .text("Negativo: "+sentiment_data.neutrals_on.rate_percentages.negativo+"%");
      }
      
    });
  }
  
  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };
  
  chart.exponent = function(value) {
    if (!arguments.length) return exponent;
    exponent = value;
    return chart;
  };
  
  chart.range = function(value) {
    if (!arguments.length) return range;
    range = value;
    return chart;
  };
  
  chart.buildColorKey = function(value) {
    if (!arguments.length) return buildColorKey;
    buildColorKey = value;
    return chart;
  };
  
  chart.buildScaleKey = function(value) {
    if (!arguments.length) return buildScaleKey;
    buildScaleKey = value;
    return chart;
  };
  
  chart.turnOffNeutrals = function(){
    
    var circles = svg.selectAll("circle").data(neutrals_off, function(d){ return d.id; });
    
    var enter = circles.enter().append("circle")
      .attr("r", 0)
      .attr("fill", function(d){ return fillColor(d.rate)})
      .attr("stroke-width", 1)
      .attr("stroke", function(d){ return strokeColor(d.rate)})
      .attr("id", function(d){ return "bubble_#{d.id}" })
      .on("mouseover", function(d,i){ return show_details(d,i,this);})
      .on("mouseout", function(d,i){ return hide_details(d,i,this);});
   
   var force = d3.layout.force()
        .nodes(neutrals_off)
        .size([width,height])
        .gravity(0.01)
        .charge(defaultCharge)
        .friction(0.9)
        .on("tick", function(e){
          circles
            .each(moveTowardsCenter(e.alpha))
            .each(buoyancy(e.alpha))
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        });
      force.start();
      
   var exit = circles.exit();
   
   enter.transition()
        .duration(2000)
        .attr("r", function(d){return d.radius});
        
   exit.transition()
        .duration(2000)
        .attr("r", 0);
   
     exit.remove();
  };
  

  
  return chart;
}