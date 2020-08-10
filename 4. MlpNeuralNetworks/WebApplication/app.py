#!flask/bin/python
from flask import Flask, request, jsonify, make_response, render_template
from function_prediction import FunctionLearner
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from function_parser import parse_function
import mimetypes
from digit_classifier import classify

mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/javascript', '.js')

app = Flask(__name__)

function_learners = []

@app.route('/')
def index():
    return render_template("home.html")

@app.route('/FunctionDrawer')
def function_drawer():
    return render_template("function_drawer.html")

@app.route('/FunctionLearner')
def function_learner():
    return render_template("function_learner.html")

@app.route('/DigitClassifier')
def digit_classifier():
    return render_template("digit_classifier.html")

'''
{
    "data": [],
    "function":
    {
        "expression": "sin(x) + 2",
        "parameters": ["x"],
        "train_domain_low": [0],
        "train_domain_high": [10],
        "size": 10
    }
    "neurons": [a, b],
    "noise_sigma": null
}
'''
@app.route('/FunctionLearner/Init', methods=['PUT'])
def init_function_learner():
    content = request.json
    data_type = request.headers.get("Data-Type")
    
    if data_type == "data":
        train_data=pd.DataFrame(data=content['data'], columns=['x', 'y'])
        function_learners.append(FunctionLearner(train_data=train_data, neurons=content['neurons'], noise_sigma=content['noise_sigma']))
    else:
        function = parse_function(content['function'])
        function_learners.append(FunctionLearner(
            function=function,
            train_domain_low=content['function']['train_domain_low'],
            train_domain_high=content['function']['train_domain_high'],
            neurons=content['neurons'],
            noise_sigma=content['noise_sigma'],
            data_size=content['function']['size']))
    
    return jsonify(len(function_learners) - 1)

'''
/FunctionLearner/Learn?learnerId=0&epochs=100
'''
@app.route('/FunctionLearner/Learn', methods=['GET'])
def learn():
    learnerId = int(request.args.get('learnerId'))
    epochs = int(request.args.get('epochs'))
    
    if learnerId >= len(function_learners):
        raise Exception("given id is not valid")

    function_learners[learnerId].learn(epochs)
    
    return "OK"

'''
{
    "learnerId": 0,
    "test_data": [],
    "x": {
        "low": 0,
        "high": 10,
        "size": 10,
        "axes":
    },
    "title": "title"
}
'''
@app.route('/FunctionLearner/PlotResult', methods=['POST'])
def plot_result():
    data_type = request.headers.get("Data-Type")

    content = request.json

    feature_dimension = function_learners[content['learnerId']].get_feature_dimension()
    if feature_dimension == 1:
        if data_type == "data":
            data = pd.DataFrame(data=content['test_data'], columns=['x', 'y'])
            error = function_learners[content['learnerId']].error(data=data)
            function_learners[content['learnerId']].plot_result(data=data, title=f'{content["title"]} - error: {error}')
        else:
            x = np.random.uniform(content['x']['low'][0] * 2, content['x']['high'][0] * 2, (content['x']['size'], 1))
            error = function_learners[content['learnerId']].error(X=x)
            function_learners[content['learnerId']].plot_result(x=x, title=f'{content["title"]} - error: {error}')
        return jsonify([plot_to_image()])
    else:
        plots = []
        for axis in range(feature_dimension):
            low = content['x']['low'][:]
            low[axis] *= 2
            high = content['x']['high'][:]
            high[axis] *= 2
            print(high)
            print(low)
            x = np.random.uniform(low, high, (content['x']['size'], feature_dimension))
            error = function_learners[content['learnerId']].error(X=x)
            function_learners[content['learnerId']].plot_axis(x=x, axis=axis, title=f"$f-{content['x']['axes'][axis]}$ plot - error: {error}")
            plots.append(plot_to_image())
        return jsonify(plots)

'''
{
    "learnerId": 0,
    "loss_ylim": [a, b]
    "lr_ylim": [a, b]
}
'''
@app.route('/FunctionLearner/PlotHistory', methods=['POST'])
def plot_history():
    content = request.json

    function_learners[content['learnerId']].plot_history()
    return plot_to_image()

def plot_to_image():
    img = BytesIO()
    plt.savefig(img, format='png')
    plt.close()
    img.seek(0)
    plot_url = str(base64.b64encode(img.getvalue())).lstrip('b').strip("'")
    return f'data:image/png;base64,{plot_url}'

'''
{
    "points": [],
    "width": 28,
    "height": 28
}
'''
@app.route('/DigitClassifier/PredictDigit', methods=['POST'])
def predict_digit():
    content = request.json
    return jsonify(classify(content['points'], content['width'], content['height']))

if __name__ == '__main__':
    app.run(debug=False)