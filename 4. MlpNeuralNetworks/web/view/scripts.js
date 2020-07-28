const ordinary_color = 'rgba(0,116,148,1)'
const capture_color = 'rgba(0,0,0,1)'

var capturing = false;
var data = [];
var i = 1;
var canvas = document.getElementById('Canvas');

function Clear() {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    $('#filename').val('');
    capturing = false;
    data = [];
}

function Start() {
    capturing = true;
}

function Save() {
    var filename = $('#filename').val();
    let csvContent = "data:text/csv;charset=utf-8,";

    let header = "x,y";
    csvContent += header + "\r\n";

    capturing = false;

    data.forEach(point => {
        let row = point.join(',');
        csvContent += row + "\r\n";
    })

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "my_data.csv".

    $('#filename').val('');

    console.log("done");
}

var mousedown = false;

function draw(mouse) {
    const context = canvas.getContext('2d');

    // Get corrent mouse coords
    var rect = canvas.getBoundingClientRect();

    var x = (mouse.originalEvent.clientX - rect.left);
    var y = (mouse.originalEvent.clientY - rect.top);

    context.fillStyle = capturing ? capture_color : ordinary_color;
    context.beginPath(); //Start path
    context.arc(x, y, 3, 0, Math.PI * 2, true);
    context.fill();

    if (capturing) {
        data.push([x, rect.height - y]);
    }
}

$(document).ready(() => {
    canvas = document.getElementById('Canvas');

    $("#Canvas").mousedown(mouse => {
        mousedown = true;
        draw(mouse);
    });
    
    $("#Canvas").mousemove(mouse => {
        if (mousedown) {
            draw(mouse);
        }
    });
    
    $("#Canvas").mouseup(mouse => {
        mousedown = false;
    })
})