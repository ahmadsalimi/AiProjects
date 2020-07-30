var canvas = null;

class FunctionDrawer {
    constructor() {
        this.ordinary_color = 'rgba(0,116,148,1)';
        this.capture_color = 'rgba(0,0,0,1)';
        this.capturing = false;
        this.in_progress = false;
        this.data = [];
        this.current_learner_id = -1;
        this.result_plot = null;
        this.history_plot = null;
        this.mousedown = false;

        this.Clear = () => {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            $('#learn-button')
                .html('Learn')
                .prop('disabled', false);

            $('#plot-result-button').prop('disabled', true);
            $('#plot-history-button').prop('disabled', true);

            this.capturing = false;
            this.data = [];
        };

        this.Start = () => {
            this.capturing = true;
        };

        this.PlotResult = () => {
            var html = '';
            this.result_plot.forEach(plot => {
                html += '<img src="' + plot + '" class="center" width="100%">'
            })
            $('#result').html(html);
            $('#plot-modal').modal('show');
        };

        this.PlotHistory = () => {
            $('#result').html(
                '<img src="' + this.history_plot + '" class="center" width="100%">'
            );

            $('#plot-modal').modal('show');
        };

        this.handleError = response => {
            showAlert("Error " + response.status, response.responseText);
            this.resetButtons();
        };

        this.onHistoryPlotReceived = image => {
            this.history_plot = image;
            showAlert("Done!", "Your drawing is learned.");
            this.resetButtons();
        };

        this.resetButtons = () => {
            $('#learn-button').html('Learn');

            if ($('#learn-button').hasClass("btn-info")) {
                $('#learn-button')
                    .removeClass("btn-info")
                    .addClass("btn-outline-success");
            }

            $('#clear-button').prop('disabled', false);
            $('#start-button').prop('disabled', false);
            $('#plot-history-button').prop('disabled', false);
            $('#plot-result-button').prop('disabled', false);
            $('#learn-button').prop('disabled', false);
        };

        this.onResultPlotReceived = image => {
            this.result_plot = image;

            $.ajax({
                method: 'POST',
                url: '/FunctionLearner/PlotHistory',
                contentType: 'application/json',
                data: JSON.stringify({
                    learnerId: this.current_learner_id,
                    loss_ylim: null,
                    lr_ylim: null
                })
            })
                .done(image => this.onHistoryPlotReceived(image))
                .fail(response => this.handleError(response));

            $('#plot-result-button').prop('disabled', false);
        };

        this.OnLearningDone = () => {
            $.ajax({
                method: 'POST',
                url: '/FunctionLearner/PlotResult',
                contentType: 'application/json',
                data: JSON.stringify({
                    learnerId: this.current_learner_id,
                    test_data: this.data,
                    title: "Result Plot"
                }),
                headers: { 'Data-Type': 'data' }
            })
                .done(image => this.onResultPlotReceived(image))
                .fail(response => this.handleError(response));

            $('#learn-button').html(
                '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>\n' +
                'Getting PLot...'
            );
        };

        this.OnInitializingDone = learnerId => {
            this.current_learner_id = learnerId;

            $.ajax({
                method: 'GET',
                url: '/FunctionLearner/Learn?learnerId=' + learnerId + '&epochs=' + $('#epochs').val()
            })
                .done(_ => this.OnLearningDone())
                .fail(response => this.handleError(response));

            $('#learn-button').html(
                '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>\n' +
                'Learning...'
            );
        };

        this.Learn = () => {
            this.capturing = false;
            this.in_progress = true;

            $.ajax({
                method: 'PUT',
                url: "/FunctionLearner/Init",
                contentType: 'application/json',
                data: JSON.stringify({
                    data: this.data,
                    neurons: [parseInt($('#neuron1').val()), parseInt($('#neuron2').val())],
                    noise_sigma: null
                }),
                headers: { 'Data-Type': 'data' }
            })
                .done(learnerId => this.OnInitializingDone(learnerId))
                .fail(response => this.handleError(response));

            $('#learn-button').html(
                '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>\n' +
                'Creating Learner...'
            ).removeClass("btn-outline-success")
                .addClass("btn-info")
                .prop('disabled', true);

            $('#clear-button').prop('disabled', true);
            $('#start-button').prop('disabled', true);
        };


        this.draw = mouse => {
            if (this.in_progress) {
                return;
            }

            const context = canvas.getContext('2d');

            // Get corrent mouse coords
            var rect = canvas.getBoundingClientRect();

            var x = (mouse.originalEvent.clientX - rect.left);
            var y = (mouse.originalEvent.clientY - rect.top);

            context.fillStyle = this.capturing ? this.capture_color : this.ordinary_color;
            context.beginPath(); //Start path
            context.arc(x, y, 3, 0, Math.PI * 2, true);
            context.fill();

            if (this.capturing) {
                this.data.push([x, rect.height - y]);
            }
        };

        return this;
    }
}

$(document).ready(() => {
    canvas = document.getElementById('Canvas');
    var drawer = new FunctionDrawer();

    $("#Canvas").mousedown(mouse => {
        drawer.mousedown = true;
        drawer.draw(mouse);
    });

    $("#Canvas").mousemove(mouse => {
        if (drawer.mousedown) {
            drawer.draw(mouse);
        }
    });

    $("#Canvas").mouseup(mouse => {
        drawer.mousedown = false;
    });

    $("#clear-button").click(drawer.Clear);
    $("#start-button").click(drawer.Start);
    $("#learn-button").click(drawer.Learn);
    $("#plot-result-button").click(drawer.PlotResult);
    $("#plot-history-button").click(drawer.PlotHistory);
})