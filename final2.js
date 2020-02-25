var canvas = document.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    width = canvas.width,
    height = canvas.height,
    radius = 8,
    strokeWidth = 3,
    nodeIdsToDisplay = [],
    transform = d3.zoomIdentity,
    ts = 0;

let intervalTime = parseInt(document.querySelector("#animation-speed").value);
// intervalTime = 1000;


let miserables = "data/miserables.json";
// let buenosAires = "data/buenosAires_unipartite_1750_1810_aggregated_10_biggest_cp.json";
// let buenosAires = "data/buenosAires_uni_1780_1820_bc.json"
let buenosAires = "data/buenosAires_uni_1780_1800_bc.json"


// TO CHANGE DATASET
let dataset = buenosAires;

// Color scale
// let color = d3.scaleOrdinal().range(d3.schemeSet3);
let color = d3.scaleOrdinal().range(d3.schemeCategory20);

// Force simulation initialization
let simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
                        .id(function(d) { return d.id; })
                        .strength(document.querySelector("#link-strength").value))
    .force("charge", d3.forceManyBody()
                        .strength(document.querySelector("#bodies-strength").value))
    .force("center", d3.forceCenter(width / 2, height / 2))
    // .force("collide", d3.forceCollide(radius))


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


d3.select("#animation-speed")
    .on("input", function(){
        let animSpeed = Number(this.value)
        console.log(animSpeed);
        document.querySelector("#animation-speed-span").textContent = animSpeed;

        intervalTime = animSpeed
    });


d3.json(dataset, function(graph){
    $(document).ready(function(){
        console.log("local file loaded");
        // copy the graph to send it, however the d3.force modification append before
        let graphCopy = JSON.parse(JSON.stringify(graph));

        function loadJSON(path, callback) {
            // function to load local json file
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', path, true);
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    callback(JSON.parse(xobj.responseText));
                }
            };
            xobj.send(null);
        }

        d3.selectAll('.button-alg')
            .on('click', function(){
                let algorithm = this.id
                launchViz(algorithm)

                d3.selectAll(".button-alg")
                    .style("background", "darkgray")

                d3.select("#" + algorithm)
                    .style("background", "firebrick")
            })


        function launchViz(algorithm){
            if (window.hasOwnProperty("interval")) {
                console.log("stop anim")
                interval.stop();
            }

            loadJSON(dataset, function(json){
                let data = json;

                const url = "http://610cde91.ngrok.io/iterative/" + algorithm;

                fetch(url,
                    {
                        method: "POST",
                        mode: "cors",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    })
                    .then(function(response) {
                        // Your code for handling the data you get from the API
                        return response.json()
                    })
                    .then(function(data) {
                        // WE HAVE THE DATA FROM HERE
                        console.log('data returned')
                        console.log(data);

                        // connect nodes and links to the simulation
                        // simulation.nodes(data.nodes);
                        // simulation.force("link")
                        //     .links(data.links);

                        // get number of times
                        for (let id in data.nodes) {
                            N_times = data.nodes[id].communities.length;
                            break;
                        }

                        document.querySelector("#animation").max = N_times - 1;

                        drawing(data);

                    })
                    .catch(function(error) {
                        // This is where you run code if the server returns any errors
                        console.log("error")
                        console.log(error)
                    });
            })
        }
    });
})


function drawing(graph){
    changeTsAbs(0);

    d3.select("#animation")
        .on("input", function(){
            document.querySelector("#animation-span").textContent = this.value;
            ts = parseInt(this.value);
            render();
        });

    d3.select("#button-layout")
        .on("click", function(){
            console.log("button");
            simulation.force("communities", forceCommunities)
            simulation.alpha(1).restart();

            // Remove community force when the simulation end after layout button is clicked
            simulation.on("end", function(){
                simulation.force("communities", null);
            })
        })

    function findNeighbors(n_id){
        console.log(n_id)
    }

    // connect nodes and links to the simulation
    simulation.nodes(graph.nodes)
        .on("tick", render)

    simulation.force("link")
        .links(graph.links);

    simulation.alpha(2).restart();

    //
    // for (let i = 0; i < 200; i++) {
    //     console.log(i);
    //     simulation.tick();
    // }

    //force of communities
    // TODO : module with other parameters and optimisation
    // When the strength is too high, some weird things happen
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

    function changeTs(add){
        console.log(add)
        ts += add;
        console.log(ts)
        document.querySelector("#animation").value = ts;
        document.querySelector("#animation-span").textContent = ts;
    }

    function changeTsAbs(value){
        ts = value;
        document.querySelector("#animation").value = ts;
        document.querySelector("#animation-span").textContent = ts;
    }

    d3.select("#button-animation")
        .on("click", function(){
            // oneStepAnimation();
            startAnimation();
        })

    function startAnimation() {
        if (ts < N_times) {
            let t0 = ts;
            d3.select("#animation-span").style("font-weight", "bold");
            interval = d3.interval(function (elapsed) {
                if (elapsed > intervalTime * (N_times - t0 - 1)) {
                    return;
                }
                if (ts >= N_times){
                    return;
                }
                oneStepAnimation();
            }, intervalTime)
        }
    }

    function oneStepAnimation(){
        // Get the index of the nodes where there has been changes
        let currentComs = graph.nodes.map((el) => el.communities[ts])
        let nextComs = graph.nodes.map((el) => el.communities[ts + 1])

        let diffComs = currentComs.map((el, i) => el - nextComs[i]);

        let nodeIdsChange = [];
        for(let i = 0; i < diffComs.length; i++){
            if (diffComs[i] != 0){
                nodeIdsChange.push(i);
            }
        }
        console.log(ts, 'index to change ', nodeIdsChange)

        for(let i = 0; i < graph.nodes.length; i++) {
            if (nodeIdsChange.includes(i)) {
                graph.nodes[i]["changing"] = true;
                d3.timeout(function(){
                    graph.nodes[i]["changing"] = false;
                    render();
                }, intervalTime / 1.5)
            } else {
                graph.nodes[i]["changing"] = false;
            }
        }
        render()

        d3.timeout(function(){
            console.log('timer')
            if (ts < N_times - 1) {
                changeTs(1);
            }
            render();
        }, intervalTime / 3)

        console.log("int ", interval)
    }

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

    // display names of nodes
    d3.select("canvas")
    .on("mousemove", displayText)

    function displayText(){
        mouseCoordinates = d3.mouse(this);
        let nodeOver = simulation.find(transform.invertX(mouseCoordinates[0]), transform.invertY(mouseCoordinates[1]), radius + 1);

        nodeIdsToDisplay = [];

        if (nodeOver != undefined){
            console.log(nodeOver);
            nodeIdsToDisplay.push(nodeOver.id);
        }
        render();
    }

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
    let r = radius;
    if (("changing" in d) & (d["changing"] == true)) {
        r = parseInt(r + (r * 0.4));
    }

    ctx.beginPath();
    ctx.moveTo(d.x + r, d.y);
    ctx.arc(d.x, d.y, r, 0, Math.PI * 2);

    if (("changing" in d) & (d["changing"] == true)) {
        // ctx.globalAlpha = 1;
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = "black";
        ctx.stroke();
    } else {
        // ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = color(d.communities[ts])
    ctx.fill()

    if (nodeIdsToDisplay.includes(d.id)){
        ctx.fillStyle = "black";
        ctx.fillText(d.firstname + " " + d.lastname, d.x+10, d.y+3);
    }
}