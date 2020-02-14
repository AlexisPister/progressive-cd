var canvas = document.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height,
    radius = 3,
    nodeIdsToDisplay = [],
    transform = d3.zoomIdentity;

//console.log(data)

var accent = d3.scaleOrdinal().range(d3.schemeSet3);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
                        .id(function(d) { return d.id; })
                        .strength(0.2))
    .force("charge", d3.forceManyBody()
                        .strength(-10))
    .force("center", d3.forceCenter(width / 2, height / 2))


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

        let strength = 2;

        // if(u_com == v_com){
        //     graph.nodes[u_ind].vx += 1 / (alpha * (graph.nodes[v_ind].x - graph.nodes[u_ind].x));
        //     graph.nodes[v_ind].vy += 1 / (alpha * (graph.nodes[u_ind].y - graph.nodes[v_ind].y));
        // } else {
        //     graph.nodes[u_ind].vx -= 1 / (alpha * (graph.nodes[v_ind].x - graph.nodes[u_ind].x));
        //     graph.nodes[v_ind].vy -= 1 / (alpha * (graph.nodes[u_ind].y - graph.nodes[v_ind].y));
        // }
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
 
    
d3.select("#link-strength")
    .on("input", linkInputted);

d3.select("#bodies-strength")
    .on("input", bodiesInputted);

d3.select(".button")
    .on("click", function(){
        simulation.force("communities", forceCommunities)
    })

function linkInputted(){
    let linkStrength = this.value;
    simulation.force("link").strength(linkStrength);
    simulation.alpha(1).restart()
}

function bodiesInputted(){
    let bodiesStrength = this.value;
    simulation.force("charge").strength(bodiesStrength);
    simulation.alpha(1).restart()
}

buenosAires = "data/buenosAires.json"
miserables = "data/miserables.json"

d3.json(miserables, function(error, graph){

    simulation.nodes(graph.nodes)
      .on("tick", render)
    
    simulation.force("link")
    .links(graph.links);

    render();

    // Dragging
    // d3.select(canvas)
    // .call(d3.drag()
    // .container(canvas)
    // .subject(dragsubject)
    // .on("start", dragstarted)
    // .on("drag", dragged)
    // .on("end", dragended));

    d3.select("canvas")
        .call(d3.zoom()
            .scaleExtent([0.25,3])
            .on("zoom", zoomed))

    function zoomed(){
        transform = d3.event.transform
        render()
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

        // draw nodes
        ctx.fillStyle = "rgb(60, 68, 92, 0.8)";
        ctx.strokeStyle = "rgb(60, 68, 92, 0.8)";
        graph.nodes.forEach(drawNode);

        // draw links
        ctx.globalAlpha = 0.5;
        graph.links.forEach(drawLink);

        ctx.restore();
    }

    // display names of nodes
    d3.select("canvas")
    .on("mousemove", displayText)

    function displayText(){
        mouseCoordinates = d3.mouse(this);
        let nodeOver = simulation.find(transform.invertX(mouseCoordinates[0]), transform.invertY(mouseCoordinates[1]), radius + 1);

        nodeIdsToDisplay = []

        if (nodeOver != undefined){
        nodeIdsToDisplay.push(nodeOver.id)
        //render()
        }
    }

    //render();
})

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
    if (!d3.event.active) simulation.alphaTarget(0.3);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
}

function drawLink(d) {
    ctx.beginPath();
    ctx.moveTo(d.source.x, d.source.y);
    ctx.lineTo(d.target.x, d.target.y);
    // ctx.strokeStyle = accent(d.statut);
    ctx.stroke();
}

function drawNode(d) {
    // console.log(d.group)
    ctx.beginPath()
    ctx.moveTo(d.x + radius, d.y);
    ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
    if (nodeIdsToDisplay.includes(d.id)){
        ctx.fillText(d.label, d.x+10, d.y+3);
    }
    ctx.fill()
}

