var canvas = document.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height,
    radius = 5,
    nodeIdsToDisplay = [],
    transform = d3.zoomIdentity,
    ts = 0;

let miserables = "data/miserables.json";
// let buenosAires = "data/buenosAires_unipartite_1750_1810_aggregated_10_biggest_cp.json";
let buenosAires = "data/buenosAires_uni_1780_1820_bc.json"


// TO CHANGE DATASET
let dataset = miserables;

// Color scale
var color = d3.scaleOrdinal().range(d3.schemeSet3);

// Force simulation initialization
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
                        .id(function(d) { return d.id; })
                        .strength(document.querySelector("#link-strength").value))
    .force("charge", d3.forceManyBody()
                        .strength(document.querySelector("#bodies-strength").value))
    .force("center", d3.forceCenter(width / 2, height / 2))
    // .force("collide", d3.forceCollide(radius))


function addTsToGraph(graph, communities, idToIndexMap){
    // from a dict of communities, insert them into the graph's nodes communities key
    for (let [c_id, comm] of Object.entries(communities)) {
        comm.forEach(function(d){
            graph.nodes[idToIndexMap[d]]["communities"].push(c_id)
        })
    }
}

function genMap(graph, attribute){
    let map =  {}
    graph.nodes.forEach(function(d, i){
        map[d[attribute]] = i
    })
    return map
}

function initializeArray(array, attributeName){
    // Intitialize an attribute as array in each object of an array
    array.forEach(function(d){
        d[attributeName] = []
    })
}


d3.json(dataset, function(graph){
    $(document).ready(function(){
        console.log("local file loaded");
        // copy the graph to send it, however the d3.force modification append before
        let graphCopy = JSON.parse(JSON.stringify(graph));

        // Initialize empty communities for each node
        initializeArray(graph.nodes, "communities");

        // map node ids to index in array
        let map = genMap(graph, "id");

        // connect client to server
        var socket = io.connect("http://127.0.0.1:5000");

        // send a message to server when socket is connected
        socket.on("connect", function() {
            console.log("sending graph to aleclust");
            socket.send(graphCopy);
        });

        // receive message
        socket.on("message", function(communities) {
            console.log("received");
            // console.log(communities.ts);
            addTsToGraph(graph, communities.communities, map);
            document.querySelector("#animation").max = parseInt(document.querySelector("#animation").max) + 1
        })
        
        // connect nodes and links to the simulation
        simulation.nodes(graph.nodes);
        simulation.force("link")
            .links(graph.links);

        console.log(graph.links)

        // for (let i = 0; i < 60; i++) {
        //     console.log(i);
        //     simulation.tick();
        // }

        drawing(graph);
    });
})


function drawing(graph){
    console.log(graph);
    
    simulation.nodes(graph.nodes)
      .on("tick", render)

    //force of communities
    // TODO : module with other parameters and optimisation
    // When the strength is too high, some weird things happend 
    function forceCommunities(alpha){
        for(var i = 0; i < graph.links.length;  ++i){
            link = graph.links[i]
            // console.log(link)
            u_ind = link.source.index
            u_com = link.source.communities[ts]
            v_ind = link.target.index
            v_com = link.target.communities[ts]

            let strength = 1;
            if(u_com == v_com){
                // same community
                if (graph.nodes[v_ind].x - graph.nodes[u_ind].x > 0) {
                    graph.nodes[u_ind].vx += strength * alpha
                    graph.nodes[v_ind].vx -= strength * alpha
                } else {
                    graph.nodes[u_ind].vx -= strength * alpha
                    graph.nodes[v_ind].vx += strength * alpha
                }
                    
                if (graph.nodes[v_ind].y - graph.nodes[u_ind].y > 0) {
                    graph.nodes[u_ind].vy += strength * alpha
                    graph.nodes[v_ind].vx -= strength * alpha
                } else {
                    graph.nodes[u_ind].vy -= strength * alpha
                    graph.nodes[v_ind].vx += strength * alpha
                }
            } else {
                // different communities
                if (graph.nodes[v_ind].x - graph.nodes[u_ind].x > 0) {
                    graph.nodes[u_ind].vx -= strength * alpha
                    graph.nodes[v_ind].vx += strength * alpha
                } else {
                    graph.nodes[u_ind].vx += strength * alpha
                    graph.nodes[v_ind].vx -= strength * alpha
                }
                    
                if (graph.nodes[v_ind].y - graph.nodes[u_ind].y > 0) {
                    graph.nodes[u_ind].vy -= strength * alpha
                    graph.nodes[v_ind].vx += strength * alpha
                } else {
                    graph.nodes[u_ind].vy += strength * alpha
                    graph.nodes[v_ind].vx -= strength * alpha
                }
            }
        }
    }
    

    // for (let i = 0; i < 200; i++) {
    //     simulation.tick();
    // }

    d3.select("#animation")
        .on("input", function(){
            document.querySelector("#animation-span").textContent = this.value;
            ts = this.value;
            render();
        });
    
    d3.select("#link-strength")
        .on("input", function(){
            let linkStrength = Number(this.value).toFixed(2);
            document.querySelector("#link-strength-span").textContent = linkStrength;
            simulation.force("link").strength(linkStrength);
            simulation.alpha(1).restart()
        });

    d3.select("#bodies-strength")
        .on("input", function(){
            let bodiesStrength = Number(this.value).toFixed(1);
            document.querySelector("#bodies-strength-span").textContent = bodiesStrength;

            simulation.force("charge").strength(bodiesStrength);
            simulation.alpha(1).restart();   
        });

    d3.select(".button")
        .on("click", function(){
            console.log("button");
            simulation.force("communities", forceCommunities)
            simulation.alpha(1).restart();

            // Remove community force when the simulation end after layout button is clicked
            simulation.on("end", function(){
                simulation.force("communities", null);
            })
        })

    // Dragging
    d3.select(canvas)
    .call(d3.drag()
    .container(canvas)
    .subject(dragsubject)
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

    d3.select("canvas")
        .call(d3.zoom()
            .scaleExtent([0.25,3])
            .on("zoom", zoomed))

    function zoomed(){
        transform = d3.event.transform
        render(ts)
    }
                                
    function dragsubject() {
        mouseCoordinates = d3.mouse(this);
        //     x = transform.invertX(mouseCoordinates[0]),
        //     y = transform.invertY(mouseCoordinates[1]),
        //     dx,
        //     dy;

        // for (let i = 0; i < data.length; i++) {
        //     dx = x - data[i].x,
        //     dy = y - data[i].y
            
        //     if (dx * dx + dy * dy < radius * radius){
        //         return data[i];
        //     }
        // }
        return simulation.find(transform.invertX(mouseCoordinates[0]), transform.invertY(mouseCoordinates[1]), radius);
    }

    function render(){
        ctx.save();

        // clear canvas
        ctx.clearRect(0, 0, width, height);

        // take into accout zooming and panning for the drawing
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);
        
        // bounding box constraints
        // graph.nodes.forEach(function(d) {
        //     d.x = Math.max(radius, Math.min(d.x, width - radius))
        //     d.y = Math.max(radius, Math.min(d.y, height - radius))
        // })

        
        ctx.fillStyle = "rgb(60, 68, 92, 0.8)";
        ctx.strokeStyle = "rgb(60, 68, 92, 0.8)";


        // draw links
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        graph.links.forEach(drawLink);
        
        // draw nodes
        ctx.globalAlpha = 1;
        graph.nodes.forEach(drawNode);

        

        ctx.restore();
    }

    // // display names of nodes
    // d3.select("canvas")
    // .on("mousemove", displayText)

    // function displayText(){
    //     mouseCoordinates = d3.mouse(this);
    //     let nodeOver = simulation.find(transform.invertX(mouseCoordinates[0]), transform.invertY(mouseCoordinates[1]), radius + 1);

    //     nodeIdsToDisplay = [];

    //     if (nodeOver != undefined){
    //         nodeIdsToDisplay.push(nodeOver.id);
    //     }
    // }
}

function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
}

function dragged() {
    d3.event.subject.fx = transform.invertX(d3.mouse(this)[0]);
    d3.event.subject.fy = transform.invertY(d3.mouse(this)[1]);
}

function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
}

function computeEuclidianDistance(x1, y1, x2, y2){
    return (x2 - x1)**2 + (y2 - y1)**2 
}

function drawLink(d) {
    x1 = d.source.x
    y1 = d.source.y
    x2 = d.target.x
    y2 = d.target.y

    if (computeEuclidianDistance(x1, y1, x2, y2) > 100) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        // if (dataset.contains("buenosAires")){
        //     ctx.strokeStyle = color(d.statut);
        // }

        ctx.stroke();
    }
}

function drawNode(d) {
    // console.log(ts);
    ctx.beginPath();
    ctx.moveTo(d.x + radius, d.y);
    ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
    if (nodeIdsToDisplay.includes(d.id)){
        ctx.fillText(d.label, d.x+10, d.y+3);
    }
    ctx.fillStyle = color(d.communities[ts])
    ctx.fill()
}