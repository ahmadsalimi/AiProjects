const ordinary_color = 'rgba(0,116,148,1)'
const capture_color = 'rgba(0,0,0,1)'

var capturing = false;
var in_progress = false;
var data = [];
var i = 1;
var canvas = document.getElementById('Canvas');
var current_learner_id = -1;

function Clear() {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    $('#learn-button')
        .html('Learn')
        .prop('disabled', false);

    capturing = false;
    data = [];
}

function Start() {
    capturing = true;
}

function onPlotReceived(image) {
    $('#learn-button')
        .html('Learn')
        .removeClass("btn-info")
        .addClass("btn-outline-success");

    $('#result').html(
        '<img src="' + image + '" class="center" width="100%">'
    );

    $('#plot-modal').modal('show');

    $('#clear-button').prop('disabled', false);
    $('#start-button').prop('disabled', false);
}

function OnLearningDone() {
    $.ajax({
        method: 'POST',
        url: '/FunctionLearner/PlotResult',
        contentType: 'application/json',
        data: JSON.stringify({
            learnerId: current_learner_id,
            test_data: data,
            title: "Result Plot"
        }),
        headers: {'Data-Type': 'data'}
    }).done(image => onPlotReceived(image));

    $('#learn-button').html(
        '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>\n' +
        'Getting PLot...'
    );
}

function OnInitializingDone(learnerId) {
    current_learner_id = learnerId;
    
    $.ajax({
        method: 'GET',
        url: '/FunctionLearner/Learn?learnerId=' + learnerId + '&epochs=' + $('#epochs').val()
    }).done(_ => OnLearningDone());

    $('#learn-button').html(
        '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>\n' +
        'Learning...'
    );
}

function Learn() {
    capturing = false;
    in_progress = true;

    $.ajax({
        method: 'PUT',
        url: "/FunctionLearner",
        contentType: 'application/json',
        data: JSON.stringify({
            data: data,
            neurons: [parseInt($('#neuron1').val()), parseInt($('#neuron2').val())],
            noise_sigma: null
        }),
        headers: {'Data-Type': 'data'}
    }).done(learnerId => OnInitializingDone(learnerId));

    $('#learn-button').html(
        '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>\n' +
        'Creating Learner...'
    ).removeClass("btn-outline-success")
        .addClass("btn-info")
        .prop('disabled', true);

    $('#clear-button').prop('disabled', true);
    $('#start-button').prop('disabled', true);
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
    if (in_progress) {
        return;
    }

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
    });
})