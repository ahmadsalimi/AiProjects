class FunctionLearner {
    constructor() {
        this.args = ['x'];
        this.expression = "";
        this.history_plot = null;
        this.result_plot = null;
        this.current_learner_id = -1;

        this.GetTrainDomain = key => {
            return this.args
                .map(arg => '#' + arg + '-' + key)
                .map(id => parseInt($(id).val()));
        }

        this.GetNoise = () => {
            if ($('#noise').val().length > 0) {
                return parseInt($('#noise').val());
            }
            return null;
        }

        this.handleError = response => {
            showAlert("Error " + response.status, response.responseText)
            $('#error-modal').modal('show');
            this.resetButtons()
        }

        this.resetButtons = () => {
            $('#learn-button').html('Learn');

            if ($('#learn-button').hasClass("btn-info")) {
                $('#learn-button')
                    .removeClass("btn-info")
                    .addClass("btn-outline-success");
            }

            $('#plot-history-button').prop('disabled', false);
            $('#plot-result-button').prop('disabled', false);
            $('#learn-button').prop('disabled', false);
        };

        this.onHistoryPlotReceived = image => {
            this.history_plot = image;
            showAlert("Done!", "Your drawing is learned.");
            this.resetButtons();
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
        }

        this.OnLearningDone = () => {
            $.ajax({
                method: 'POST',
                url: '/FunctionLearner/PlotResult',
                contentType: 'application/json',
                data: JSON.stringify({
                    learnerId: this.current_learner_id,
                    x: {
                        low: this.GetTrainDomain('low'),
                        high: this.GetTrainDomain('high'),
                        size: parseInt($('#size').val()) * 4,
                        axes: this.args
                    },
                    title: "Result Plot"
                }),
                headers: { 'Data-Type': 'function' }
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
            console.log(this.expression);
            $.ajax({
                method: 'PUT',
                url: "/FunctionLearner/Init",
                contentType: 'application/json',
                data: JSON.stringify({
                    function: {
                        expression: this.expression,
                        parameters: this.args,
                        train_domain_low: this.GetTrainDomain('low'),
                        train_domain_high: this.GetTrainDomain('high'),
                        size: parseInt($('#size').val())
                    },
                    neurons: [parseInt($('#neuron1').val()), parseInt($('#neuron2').val())],
                    noise_sigma: this.GetNoise()
                }),
                headers: { 'Data-Type': 'function' }
            })
                .done(learnerId => this.OnInitializingDone(learnerId)) // TODO
                .fail(response => this.handleError(response));

            $('#learn-button').html(
                '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>\n' +
                'Creating Learner...'
            ).removeClass("btn-outline-success")
                .addClass("btn-info")
                .prop('disabled', true);
        }

        this.PlotHistory = () => {
            $('#result').html(
                '<img src="' + this.history_plot + '" class="center" width="100%">'
            );

            $('#plot-modal').modal('show');
        }

        this.PlotResult = () => {
            var html = '';
            this.result_plot.forEach(plot => {
                html += '<img src="' + plot + '" class="center" width="100%">'
            })
            $('#result').html(html);
            $('#plot-modal').modal('show');
        };

        this.UpdateArgsFields = () => {
            var html = ''
            this.args.forEach(arg => {
                html += '<input type="text" id="' + arg + '-low" class="form-control" placeholder="' + arg + ' low" aria-label="' + arg + ' low" aria-describedby="basic-addon2">\n' +
                    '<input type="text" id="' + arg + '-high" class="form-control" placeholder="' + arg + ' high" aria-label="' + arg + ' high" aria-describedby="basic-addon2">\n';
            });
            $('#domain').html(html);
        }
    }
}

function ListenFunctionField(learner) {
    var MQ = MathQuill.getInterface(2);

    var mathFieldSpan = document.getElementById('math-field');
    var mathField = MQ.MathField(mathFieldSpan, {
        spaceBehavesLikeTab: true,
        handlers: {
            edit: function () {
                learner.expression = mathField.latex().replace(/(\\left)|(\\right)/gi, "");
                console.log(learner.expression);
            }
        }
    });

    MQ.StaticMath(document.getElementById('f-label'));
    MQ.StaticMath(document.getElementById('end-args'));

    var argFieldSpan = document.getElementById('args');
    var argField = MQ.MathField(argFieldSpan, {
        spaceBehavesLikeTab: true,
        handlers: {
            edit: function () {
                var argsString = argField.latex();
                if (argsString.startsWith(',') || argsString.endsWith(',')) {
                    return;
                }

                learner.args = argsString.split(",");
                learner.UpdateArgsFields()
            }
        }
    });
}

$(document).ready(() => {
    learner = new FunctionLearner();
    ListenFunctionField(learner);
    $("#learn-button").click(learner.Learn);
    $("#plot-result-button").click(learner.PlotResult);
    $("#plot-history-button").click(learner.PlotHistory);
});