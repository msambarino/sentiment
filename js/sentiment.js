function sentimentOrbit(){
	//d3 objects
	var orbit; // d3 orbit layout - Controls sentiment orbital centers.
	var force; // d3 force layout - Controls sentiment nodes force interactions.
	var collisionForce; // d3 force layout - Force to repel coliding nodes on mouseover.
	var circles; // The svg circles that represent the sentiment nodes.
	
	//d3 settings
		//	orbit
	var orbitNodes = { children:[{"sentiment": "positive"}, {"sentiment": "neutral"}, {"sentiment": "negative"}]}; // sentiment orbital centers
	var orbitScale = d3.scale.linear().domain([1, 3]).range([3.8, 1.5]).clamp(true);
	var orbitRadius = 500; // default orbit radius.
	var mode = "flat"; //orbit mode, options are: flat, atomic, solar.
	var sentimentCenter = d3.scale.ordinal().domain(["positive","neutral","negative"]); // orbital center for each sentiment.
	var centers = [0,1,2] // orbital center for each sentiment - default is pos, neu, neg.
	var speed = d3.scale.ordinal().domain(["negative","neutral","positive"]); // orbital centers revolution speed.
	var speeds = [1,1,1]; // orbital centers revolution speed, default is 1 for each.
	var fillColor = d3.scale.ordinal().domain(["negative","neutral","positive"]).range(["#FB0106", "#3487BE", "#4EC208"]);
  	var strokeColor = d3.scale.ordinal().domain(["negative","neutral","positive"]).range(["#BB0104", "#2D75A4", "#44A807"]);
	var sentimentLabel = d3.scale.ordinal().domain([-2,-1,0,1,2]).range(["negative","negative","neutral","positive","positive"]);
	
		//	force
	var xForce = 1; // Attraction to orbital center across X axis.
	var yForce = 1; // Attraction to orbital center across Y axis.
	var gravity = 0.1; // Attraction to center of the orbit.
	var charge = 40; // Coefficient of attraction between nodes.
	var radiusScale = d3.scale.pow().exponent(5).domain([2,80,100]).range([2,40,60]); // sentiment nodes radius scale.
	
	//chart settings
	var width = 1000;
	var height = 800;
	var image = null; // Image to use in the center of the orbit, an object with attributes: url, width, height
	var hideOrbit = true; // Indicates if the orbital rings should be displayed or not.
	var hideNodes = true; // Indicates if the orbital centers should be displayed or not.
	var neutrals_on = true; // Indicates which data set should be used.
	var tooltip = CustomTooltip("sentiment_tooltip", 140);	

	//chart objects
	var sentiment_data; // The complete sentiment data set.
	var nodes; // The complete sentiment data set.


	function chart(selection){
		selection.each(function(sent_data){
			sentiment_data = sent_data;
			var data = neutrals_on ? sentiment_data.neutrals_on : sentiment_data.neutrals_off;
			speed.range(speeds);
			sentimentCenter.range(centers);
			
			//Sort by klout score so that smaller cirles are shown above larger circles.
			data.nodes.sort(function(a,b){ return b.klout - a.klout;});
			
			//Build sentiment nodes from sentiment data.
			nodes = data.nodes.map(function(d, i){
				return {
					klout: d.klout ? d.klout : 10,
					name: d.username,
					followers: d.followers, 
					following: d.following,
					sentiment: sentimentLabel(d.rate),
					url: d.url,
					x: Math.random() * width,
					y: Math.random() * height,
					radius: radiusScale(d.klout),
					id: d.id
				};
			});
			
			//Create svg element for sentiment chart.
			d3.select(this).append("svg")
				.attr("width", width)
        		.attr("height", height);
				
			// Place image in center of the orbit.
			if (image != null){
				d3.select("svg")
					.append("image")
					.attr("xlink:href", image.url)
					.attr("x", width/2 - image.width/2)
					.attr("y", height/2 - image.height/2)
					.attr("width", image.width)
					.attr("height", image.height);
			}
			
			//Initializae orbit layout
			orbit = d3.layout.orbit().size([orbitRadius,orbitRadius])
				.children(function(d) {return d.children})
  				.revolution(function(d) {return speed(d.sentiment)})
  				.orbitSize(function(d) {return orbitScale(d.depth)})
  				.speed(1)
  				.mode(mode)
				.nodes(orbitNodes)
				.on("tick", function() {
				    d3.selectAll("g.node")
				      .attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")"});
					force.resume();
	  			});
			
			//center orbit in the center of the visualization.	
			orbit.nodes()[0].x = width/2;
			orbit.nodes()[0].y = height/2;
			
			//Create svg elements for orbital centers.
			d3.select("svg")
				.append("g")
				.attr("class", "viz")
				  .selectAll("g.node").data(orbit.nodes())
				  .enter()
				  .append("g")
				  .attr("class", "node")
				  .attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")";});
			
			//Create circle representation of orbital centers if applicable.
			if (!hideNodes){
				d3.selectAll("g.node")
				  .append("circle")
				  .attr("r", 10)
				  .style("fill", "lightgray")
				  .style("stroke", function(d) {return d.sentiment ? strokeColor(d.sentiment) : "lightgray";});	
			}
			
			//Create svg elements to display orbital rings if applicable.
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

  			orbit.start();
			  
			//Create svg elements to represent sentiment nodes.
			circles = d3.select("g.viz").selectAll("g.node").data(nodes, function(d, i){return d.id;})
		    	.enter()
				.insert("circle")
		        .attr("r", 0)
		        .attr("fill", function(d){ return fillColor(d.sentiment)})
		        .attr("stroke-width", 1)
		        .attr("stroke", function(d){ return strokeColor(d.sentiment)})
				.attr("id", function(d){return d.id;})
				.attr("class", "sentiment-node")
				.on("mouseover", function(d,i){ return mouseover(d,i,this);})
       			.on("mouseout", function(d,i){ return mouseout(d,i,this);});
				   
			//Initialize  and start sentiment force
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
				}).start();
				
			//Animate sentiment nodes entrance.
			circles.transition()
       			.duration(2000)
        		.attr("r", function(d){return radiusScale(d.klout);});
				
			drawScaleKey();
			drawColorKey(data.rate_percentages);
				
		});
		
	}
	var i = 0;
	//HELPER FUNCTIONS
	var moveTowardsCenter = function(alpha) {
		    return function(d){
				var center = orbitNodes.children[sentimentCenter(d.sentiment)];
				d.y = d.y + (center.y - d.y) * (0.1 + 0.02) * yForce;
		     	d.x = d.x + (center.x - d.x) * (0.1 + 0.02) * xForce;
			};
		};
			  
	var expandFrom = function(center, alpha) {
			return function(d){
				var a = Math.abs(center.x - d.x);
				var b = Math.abs(center.y - d.y)
				if(center.sentiment == d.sentiment && 
				 	Math.sqrt(a*a + b*b) < center.radius + 5){
						 
						d.y = d.y + (d.y - center.y) * (0.1 + 0.02);
		      			d.x = d.x + (d.x - center.x) * (0.1 + 0.02);		
				}
		    };
		};
	
	//Mouse over sentiment node.
	var mouseover = function(data, i, element){
			//Stop orbit and sentiment force so that elements stand still.
			orbit.stop();
			force.stop();
			
			//Filter for nodes in the same cluster (same sentiment).
			var sentiment = data.sentiment;
			var sentimentNodes = nodes.filter(function(e,i,a){
				return e.sentiment == sentiment && e.id !== data.id;
			});
			
			//Repel colliding nodes.
			collisionForce = d3.layout.force()
		    .nodes(sentimentNodes)
		    .friction(0.7)
		    .charge(0)
		    .gravity(0)
		    .alpha(0.1)
			.on("tick", function(e){
				circles
					.each(expandFrom(data, e.alpha))
					.attr("cx", function(d) { return d.x })
	    			.attr("cy", function(d) { return d.y });
			})
			.start();
		
			//Get svg element for the selected node and show it's details in tooltip.
		    d3.select(element).attr("stroke", "black");
		    var content = "<img src=\"" + data.url + "\" height=\"40\" width=\"40\"></img><br/>";
		    content += "<span class=\"name\">Name:</span><span class=\"value\"> @" + data.name + "</span><br/>";
		    content += "<span class=\"name\">Followers:</span><span class=\"value\"> " + data.followers + "</span><br/>";
		    content += "<span class=\"name\">Following:</span><span class=\"value\"> " + data.following + "</span><br/>";
		    content += "<span class=\"name\">Klout:</span><span class=\"value\"> " + data.klout + "</span><br/>";
		    tooltip.showTooltip(content, d3.event);
		};
			  
	  //Mouse out of sentiment node.
	  var mouseout = function(data, i, element){
		  	//Stop repeling colliding nodes.
			collisionForce.stop();
			//Resume orbit and sentiment force.
			orbit.start();
			force.resume();
			//Hide sentiment node tooltip.
		    d3.select(element).attr("stroke", function(d){ return strokeColor(d.sentiment)});
		    tooltip.hideTooltip();
		};
	
	var drawScaleKey = function(){
		var key = d3.select("#scaleKey").append("svg")
	          .attr("width", 220)
	          .attr("height",110);
			  
		 	drawScaleCirlce(key,40,"Influencia Alta");
			drawScaleCirlce(key,20,"Influencia Media");
			drawScaleCirlce(key,4,"Influencia Baja");
	}
		
	var drawScaleCirlce = function(key, radius, text){
				var maxRadius = 40;
				var cx = maxRadius;
		        var textX = cx + maxRadius + 25;
				var cyMax = maxRadius + 5;
				var cy = cyMax + maxRadius - radius;
				key.append("circle")
					.attr('r', radius)
					.attr('class',"scaleKeyCircle")
		          	.attr('cx', cx)
		          	.attr('cy', cy);
			  	key.append("text")
				  	.attr("x", textX)
			      	.attr("y", cy - radius + 2.5)
			     	.attr("class", "scaleKeyText")
			      	.text(text);
		        key.append("path")
		          .attr("d", "M "+cx+" "+(cy - radius)+" L "+ (textX - 5) +" "+ (cy - radius))
		          .attr("class","scaleKeyStroke");
	};
	
	var drawColorKey = function(data){
		var key = d3.select("#colorKey").append("svg")
	          .attr("width", 220)
	          .attr("height",110)
			  .attr("opacity",1.0);
			  
		if (neutrals_on){
			drawColorCirlce(key,data.positivo,"Positivo", fillColor("positive"), 0);
			drawColorCirlce(key,data.neutral,"Neutral", fillColor("neutral"), 1);
			drawColorCirlce(key,data.negativo,"Negativo", fillColor("negative"), 2);
		}else {
			drawColorCirlce(key,data.positivo,"Positivo", fillColor("positive"), 0);
			drawColorCirlce(key,data.negativo,"Negativo", fillColor("negative"), 1);
		}
		 	
	}
	
	var drawColorCirlce = function(key, percentage, label, color, order){
				var r = 10;
				var padding = 10;
				var text = label + ": "+percentage+"%";
				var cx = 20;
				var cy = 10 + order * (2 * r + padding);
				var textX = 45;
				var textY = cy + r / 2;
					
				key.append("circle")
					.attr("r", r)
					.attr("cx", cx)
					.attr("cy", cy)
					.attr("fill", color)
					.attr("id", "color-"+label);
        
		        key.append("text")
		          .attr("x", textX)
		          .attr("y", textY)
		          .attr("class", "colorKeyText")
				  .attr("id", "text-"+label)
		          .text(text);
	};
	
	//FUNCTIONS
	chart.toggleNeutrals = function(){
		orbit.stop();
		orbit.nodes().splice(0,4);
		neutrals_on = !neutrals_on;
		var data = neutrals_on ? sentiment_data.neutrals_on : sentiment_data.neutrals_off;
		if (neutrals_on){
			orbitNodes = { children:[{"sentiment": "positive"}, {"sentiment": "neutral"}, {"sentiment": "negative"}]}; // sentiment orbital centers
			sentimentCenter.domain(["positive", "neutral", "negative"]).range([0,1,2]);
			speed.domain(["positive", "neutral", "negative"]).range([1,1,1]);
		}else{
			orbitNodes = { children:[{"sentiment": "positive"}, {"sentiment": "negative"}]}; // sentiment orbital centers
			sentimentCenter.domain(["positive", "negative"]).range([0,1]);
			speed.domain(["positive", "negative"]).range([1,1]);
		}
		orbit.nodes(orbitNodes);
		orbit.nodes()[0].x = width/2;
		orbit.nodes()[0].y = height/2;
		orbit.speed(1).revolution(function(d){ return speed(d.sentiment)});
		
		//Create svg elements for orbital centers.
		d3.selectAll("g.node").remove();
		d3.select("g.viz")
			.selectAll("g.node").data(orbit.nodes())
				.enter()
				.append("g")
				.attr("class", "node")
				.attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")";});
		force.stop();
		
		nodes = data.nodes.map(function(d, i){
				return {
					klout: d.klout ? d.klout : 10,
					name: d.username,
					followers: d.followers, 
					following: d.following,
					sentiment: sentimentLabel(d.rate),
					url: d.url,
					x: Math.random() * width,
					y: Math.random() * height,
					radius: radiusScale(d.klout),
					id: d.id
				};
			});


		circles = d3.select("g.viz").selectAll(".sentiment-node").data(nodes, function(d, i){return d.id;});
		circles.exit().transition().duration(400).attr("r", 0).remove();

		circles.enter()
			.insert("circle")
	        .attr("r", 0)
	        .attr("fill", function(d){ return fillColor(d.sentiment);})
	        .attr("stroke-width", 1)
	        .attr("stroke", function(d){ return strokeColor(d.sentiment);})
			.attr("id", function(d){return d.id;})
			.attr("class", "sentiment-node")
			.on("mouseover", function(d,i){ return mouseover(d,i,this);})
   			.on("mouseout", function(d,i){ return mouseout(d,i,this);})
			   

		force = d3.layout.force()
			    .nodes(nodes)
				.size([500,500])
			    .friction(0.9)
			    .charge(function(d){ return -Math.pow(d.klout, 2.0) / charge;})
			    .gravity(gravity)
				.on("tick", function(e){
					d3.selectAll(".sentiment-node")
						.each(moveTowardsCenter(e.alpha))
						.attr("cx", function(d) { return d.x; })
            			.attr("cy", function(d) { return d.y; });
				}).start();
				
		circles.transition()
       		.duration(2000)
        	.attr("r", function(d){return d.radius;});
		orbit.start();
				
		d3.select("#colorKey").select("svg").transition().duration(500).attr("opacity", 0).each("end", function(){
			d3.select("#colorKey").select("svg").remove();
			drawColorKey(data.rate_percentages);
		});

	};
	
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
	
	//ATTRIBUTES
	
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
	
	chart.neutralsOn = function(value) {
    	if (!arguments.length) return neutrals_on;
    	neutrals_on = value;
    	return chart;
  	};
	  
	return chart;
}