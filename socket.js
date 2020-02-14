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



loadJSON("data/miserables.json", function(json){
    // Client Side Javascript
    $(document).ready(function(){

        // connect client to server
        var socket = io.connect("http://127.0.0.1:5000");

        // send a message to server when socket is connected
        socket.on('connect', function() {
            socket.send(json);
        });

        // receive message
        socket.on("message", function(result) {
            console.log(result);
        })

        // $("#send-button").on("click", function(){
        //     socket.send("message content");
        // })

    });
})


