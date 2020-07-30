var canvas = null;

class DigitClassifier {
    constructor() {
        this.mousedown = false;

        this.Clear = () => {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        };

        this.GetImageData = () => {
            var rect = canvas.getBoundingClientRect();
            const context = canvas.getContext('2d');
            var points = [];

            console.log(rect.width);

            for (let x = 0; x < rect.width; x++) {
                for (let y = 0; y < rect.height; y++) {
                    var data = context.getImageData(x, y, 1, 1).data;
                    // console.log(data.length);
                    if (data[3] == 255) {
                        points.push([x, y]);
                    }
                }
            }

            console.log('number of points = ' + points.length);
            return {
                points: points,
                width: rect.width,
                height: rect.height
            };
        };

        this.onGuessDone = response => {
            for (let digit = 0; digit < 10; digit++) {
                $('#' + digit).html(response[digit].toFixed(2));
                $('#result').html("The guessed digit: " + response.indexOf(Math.max(...response)))
            }
        } 

        this.Guess = () => {
            $.ajax({
                method: 'POST',
                url: '/DigitClassifier/PredictDigit',
                contentType: 'application/json',
                data: JSON.stringify(this.GetImageData())
            }).done(response => this.onGuessDone(response))
                .fail(response => showAlert("Error " + response.status, response.responseText));
        };

        this.draw = mouse => {
            const context = canvas.getContext('2d');

            // Get corrent mouse coords
            var rect = canvas.getBoundingClientRect();

            var x = (mouse.originalEvent.clientX - rect.left);
            var y = (mouse.originalEvent.clientY - rect.top);

            context.fillStyle = 'rgba(0,0,0,1)';
            context.beginPath(); //Start path
            context.arc(x, y, 15, 0, Math.PI * 2, true);
            context.fill();
        };
    }
}

$(document).ready(() => {
    canvas = document.getElementById('Canvas');
    var classifier = new DigitClassifier();

    $("#Canvas").mousedown(mouse => {
        classifier.mousedown = true;
        classifier.draw(mouse);
    });

    $("#Canvas").mousemove(mouse => {
        if (classifier.mousedown) {
            classifier.draw(mouse);
        }
    });

    $("#Canvas").mouseup(mouse => {
        classifier.mousedown = false;
    });

    $("#clear-button").click(classifier.Clear);
    $("#guess-button").click(classifier.Guess);
})