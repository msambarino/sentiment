function sentimentOrbit(){
	var orbit;
	var orbitNodes;
	var width = 950;
	var height = 750;	
	var speed = d3.scale.ordinal().domain(["negative","neutral","positive"]).range([1, 1, 1]);
	
	function chart(selection){
		selection.each(function(data){

			var fillColor = d3.scale.ordinal().domain(["negative","neutral","positive"]).range(["#FB0106", "#3487BE", "#4EC208", "gray"]);
  			var strokeColor = d3.scale.ordinal().domain(["negative","neutral","positive"]).range(["#BB0104", "#2D75A4", "#44A807", "gray"]);
			
			
			var orbitScale = d3.scale.linear().domain([1, 3]).range([3.8, 1.5]).clamp(true);
  			var radiusScale = d3.scale.pow().exponent(5).domain([2,80]).range([2,40]);
			  
			var sentimentCenter = d3.scale.ordinal().domain(["positive","neutral","negative"]).range([0,1,2]);
			
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
					sentiment: d.sentiment,
					x: Math.random() * width,
					y: Math.random() * height,
					id: i
				};
			});
			
//			var links = data.nodes.map(function(d, i){
//				return {
//					source: i,
//					target: sentimentCenter(d.sentiment)
//				};
//			});
			
			orbit = d3.layout.orbit().size([500,500])
				.children(function(d) {return d.children})
  				.revolution(function(d) {return speed(d.sentiment)})
  				.orbitSize(function(d) {return orbitScale(d.depth)})
  				.speed(1)
  				.mode("flat")
				.nodes(orbitNodes);
				
			orbit.nodes()[0].x = width/2;
			orbit.nodes()[0].y = height/2;
			
			var svg = d3.select(this).append("svg")
				.attr("width", width)
        		.attr("height", height);
			
			
			d3.select("svg")
				.append("g")
				.attr("class", "viz")
				.attr("transform", "translate(50,50)")
				  .selectAll("g.node").data(orbit.nodes())
				  .enter()
				  .append("g")
				  .attr("class", "node")
				  .attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")";});
			
			d3.selectAll("g.node")
				  .append("circle")
				  .attr("r", 10)
				  .style("fill", "gray")
				  .style("stroke", function(d) {return strokeColor(d.sentiment);});
			
			d3.select("g.viz")
				  .selectAll("circle.ring")
				  .data(orbit.orbitalRings())
				  .enter()
				  .insert("circle", "g")
				  .attr("class", "ring")
				  .attr("r", function(d) {return d.r})
				  .attr("cx", width/2)
				  .attr("cy", height/2);
				  
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
			      d.y = d.y + (center.y - d.y) * (0.1 + 0.02) ;
			      d.x = d.x + (center.x - d.x) * (0.1 + 0.02) ;
			    };
			  };
			
			var force = d3.layout.force()
			    .nodes(nodes)
				.size([500,500])
			    .friction(0.7)
			    .charge(function(d){ return -Math.pow(d.klout, 2.0) / 20})
			    .gravity(0.1)
			    .alpha(0.1)
				.on("tick", function(e){
					circles
						.each(moveTowardsCenter(e.alpha))
						.attr("cx", function(d) { return d.x; })
            			.attr("cy", function(d) { return d.y; });
						
//					link.attr('x1', function(d) { return d.source.x; })
//        				.attr('y1', function(d) { return d.source.y; })
//        				.attr('x2', function(d) { return d.target.x; })
//        				.attr('y2', function(d) { return d.target.y; });
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
	
	return chart;
}