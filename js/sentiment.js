function sentimentOrbit(){
	var orbit;
	var force;
	var orbitNodes;
	var width = 1000;
	var height = 800;	
	var speed = d3.scale.ordinal().domain(["negative","neutral","positive"]);
	var sentimentCenter = d3.scale.ordinal().domain(["positive","neutral","negative"]);
	var speeds = [1,1,1];
	var centers = [0,1,2]
	var orbitRadius = 500;
	var mode = "flat";
	var xForce = 1;
	var yForce = 1;
	var gravity = 0.4;
	var charge = 30;
	var image = null;
	var hideOrbit = true;
	var hideNodes = true;
	
	function chart(selection){
		selection.each(function(data){

			var fillColor = d3.scale.ordinal().domain(["negative","neutral","positive"]).range(["#FB0106", "#3487BE", "#4EC208"]);
  			var strokeColor = d3.scale.ordinal().domain(["negative","neutral","positive"]).range(["#BB0104", "#2D75A4", "#44A807"]);
			var sentimentLabel = d3.scale.ordinal().domain([-2,-1,0,1,2]).range(["negative","negative","neutral","positive","positive"]);
			speed.range(speeds);
			sentimentCenter.range(centers)
			
			var orbitScale = d3.scale.linear().domain([1, 3]).range([3.8, 1.5]).clamp(true);
  			var radiusScale = d3.scale.pow().exponent(5).domain([2,80]).range([2,40]);
			  

			
			var posCenter = {
				"sentiment": "positive"
			};
			var negCenter = {
				"sentiment": "negative"
			};
			var neuCenter = {
				"sentiment": "neutral"
			};
			
			orbitNodes = {
					children:[posCenter, neuCenter, negCenter]
			};
			
			data.nodes.sort(function(a,b){ return b.klout - a.klout;});
			
			var nodes = orbitNodes.children.concat(data.nodes).map(function(d, i){
				return {
					klout: d.klout ? d.klout : 10,
					name: d.username,
					followers: d.followers, 
					following: d.following,
					sentiment: sentimentLabel(d.rate),
					url: d.url,
					x: Math.random() * width,
					y: Math.random() * height,
					id: i
				};
			});
			
			orbit = d3.layout.orbit().size([orbitRadius,orbitRadius])
				.children(function(d) {return d.children})
  				.revolution(function(d) {return speed(d.sentiment)})
  				.orbitSize(function(d) {return orbitScale(d.depth)})
  				.speed(1)
  				.mode(mode)
				.nodes(orbitNodes);
				
			orbit.nodes()[0].x = width/2;
			orbit.nodes()[0].y = height/2;
			
			var svg = d3.select(this).append("svg")
				.attr("width", width)
        		.attr("height", height);
			
			if (image != null){
				d3.select("svg")
					.append("image")
					.attr("xlink:href", image.url)
					.attr("x", width/2 - image.width/2)
					.attr("y", height/2 - image.height/2)
					.attr("width", image.width)
					.attr("height", image.height);
			}
			
			d3.select("svg")
				.append("g")
				.attr("class", "viz")
				  .selectAll("g.node").data(orbit.nodes())
				  .enter()
				  .append("g")
				  .attr("class", "node")
				  .attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")";});
			
			if (!hideNodes){
				d3.selectAll("g.node")
				  .append("circle")
				  .attr("r", 10)
				  .style("fill", "lightgray")
				  .style("stroke", function(d) {return d.sentiment ? strokeColor(d.sentiment) : "lightgray";});	
			}
			
			if (!hideOrbit){
				d3.select("g.viz")
				  .selectAll("circle.ring")
				  .data(orbit.orbitalRings())
				  .enter()
				  .insert("circle", "g")
				  .attr("class", "ring")
				  .attr("r", function(d) {return d.r})
				  .attr("cx", width/2)
				  .attr("cy", height/2);	
			}
			
				  
			orbit.on("tick", function() {
			    d3.selectAll("g.node")
			      .attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")"});
				force.resume();

  			});

  			orbit.start();
			  
			var tooltip = CustomTooltip("sentiment_tooltip", 140);
			var show_details = function(data, i, element){
				orbit.stop();
				force.stop();
			    d3.select(element).attr("stroke", "black");
			    var content = "<img src=\"" + data.url + "\" height=\"40\" width=\"40\"></img><br/>";
			    content += "<span class=\"name\">Name:</span><span class=\"value\"> @" + data.name + "</span><br/>";
			    content += "<span class=\"name\">Followers:</span><span class=\"value\"> " + data.followers + "</span><br/>";
			    content += "<span class=\"name\">Following:</span><span class=\"value\"> " + data.following + "</span><br/>";
			    content += "<span class=\"name\">Klout:</span><span class=\"value\"> " + data.klout + "</span><br/>";
			    tooltip.showTooltip(content, d3.event);
  }

  //Function to hide tooltip for a given sentiment node.
			var hide_details = function(data, i, element){
				orbit.start();
				force.resume();
			    d3.select(element).attr("stroke", function(d){ return strokeColor(d.sentiment)});
			    tooltip.hideTooltip();
  }
			  
			var circles = d3.select("g.viz").selectAll("g.node").data(nodes.slice(3), function(d){return d.id;})
		    	.enter()
				.insert("circle")
		        .attr("r", 0)
		        .attr("fill", function(d){ return fillColor(d.sentiment)})
		        .attr("stroke-width", 1)
		        .attr("stroke", function(d){ return strokeColor(d.sentiment)})
				.on("mouseover", function(d,i){ return show_details(d,i,this);})
       			.on("mouseout", function(d,i){ return hide_details(d,i,this);});
			
//			var link = svg.selectAll('.link')
//    			.data(links);
			var moveTowardsCenter = function(alpha) {
			    return function(d){
					var center = orbitNodes.children[sentimentCenter(d.sentiment)]
			      d.y = d.y + (center.y - d.y) * (0.1 + 0.02) * yForce;
			      d.x = d.x + (center.x - d.x) * (0.1 + 0.02) * xForce;
			    };
			  };
			
			force = d3.layout.force()
			    .nodes(nodes)
				.size([500,500])
			    .friction(0.9)
			    .charge(function(d){ return -Math.pow(d.klout, 2.0) / charge;})
			    .gravity(gravity)
			    .alpha(0.1)
				.on("tick", function(e){
					circles
						.each(moveTowardsCenter(e.alpha))
						.attr("cx", function(d) { return d.x; })
            			.attr("cy", function(d) { return d.y; });
				});
				
			force.start();
				
			circles.transition()
       			.duration(2000)
        		.attr("r", function(d){return radiusScale(d.klout);});
			
		});
	}
	
	chart.changeMode = function(_mode){
	    orbit.mode(_mode)
	    .nodes(orbitNodes);
	
		orbit.nodes()[0].x = width/2;
		orbit.nodes()[0].y = height/2;
		  d3.select("g.viz")
		  .selectAll("circle.ring")
		  .data(orbit.orbitalRings())
		    .exit()
		    .transition()
		    .remove();
	
	    d3.select("g.viz")
	    .selectAll("circle.ring")
	    .data(orbit.orbitalRings())
	    .enter()
	    .insert("circle", "g")
	    .attr("class", "ring");
	    
	    d3.selectAll("circle.ring")
	    .attr("r", function(d) {return d.r})
	    .attr("cx", width/2)
	    .attr("cy", height/2);
	};
	
	chart.changeRadius = function(radius){
		orbit.size([radius, radius]).nodes(orbitNodes);
		
		orbit.nodes()[0].x = width/2;
		orbit.nodes()[0].y = height/2;
		  d3.select("g.viz")
		  .selectAll("circle.ring")
		  .data(orbit.orbitalRings())
		    .exit()
		    .transition()
		    .remove();
	
	    d3.select("g.viz")
	    .selectAll("circle.ring")
	    .data(orbit.orbitalRings())
	    .enter()
	    .insert("circle", "g")
	    .attr("class", "ring");
	    
	    d3.selectAll("circle.ring")
	    .attr("r", function(d) {return d.r})
	    .attr("cx", width/2)
	    .attr("cy", height/2);
	};
	
	chart.changeSpeed = function(speeds){
		speed.range(speeds);
	};
	
	chart.orbitRadius = function(value) {
    	if (!arguments.length) return orbitRadius;
    	orbitRadius = value;
    	return chart;
  	};
	  
	chart.nodeSpeeds = function(value) {
    	if (!arguments.length) return speeds;
    	speeds = value;
    	return chart;
  	};
	  
	chart.mode = function(value) {
    	if (!arguments.length) return mode;
    	mode = value;
    	return chart;
  	};
	  
	chart.positions = function(value) {
    	if (!arguments.length) return centers;
    	centers = value;
    	return chart;
  	};
	  
	chart.xForce = function(value) {
    	if (!arguments.length) return xForce;
    	xForce = value;
    	return chart;
  	};
	
	chart.yForce = function(value) {
    	if (!arguments.length) return yForce;
    	yForce = value;
    	return chart;
  	};
	  
	chart.gravity = function(value) {
    	if (!arguments.length) return gravity;
    	gravity = value;
		force.gravity(gravity);
    	return chart;
  	};
	
	chart.charge = function(value) {
    	if (!arguments.length) return charge;
    	charge = value;
		force.charge(function(d){ return -Math.pow(d.klout, 2.0) / charge;});
		force.start();
    	return chart;
  	};
	  
	chart.image = function(value) {
    	if (!arguments.length) return image;
    	image = value;
    	return chart;
  	};
	  
	chart.hideNodes = function(value) {
    	if (!arguments.length) return hideNodes;
    	hideNodes = value;
    	return chart;
  	};
	  
	 chart.hideOrbit = function(value) {
    	if (!arguments.length) return hideOrbit;
    	hideOrbit = value;
    	return chart;
  	};
	  
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
	  
	return chart;
}