#!flask/bin/python
from flask import Flask, request, jsonify, make_response, render_template
from function_prediction import FunctionLearner
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from function_parser import parse_function

app = Flask(__name__)

function_learners = []

@app.route('/')
def index():
    return render_template("view/index.html")

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
@app.route('/FunctionLearner', methods=['PUT'])
def create_function_learner():
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
        "size": 10
    },
    "title": "title"
}
'''
@app.route('/FunctionLearner/PlotResult', methods=['POST'])
def plot_result():
    data_type = request.headers.get("Data-Type")

    content = request.json

    if data_type == "data":
        data = pd.DataFrame(data=content['test_data'], columns=['x', 'y'])
        function_learners[content['learnerId']].plot_result(data=data, title=content['title'])
    else:
        function_learners[content['learnerId']].plot_result(x=np.random.uniform(content['x']['low'], content['x']['high'], content['x']['size']), title=content['title'])

    return plot_to_image()

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

# TODO: plot_axis and other functions

'''
{
    "learnerId": 0,
    "low": 0,
    "high": 10,
    "size": 10,
    "axis": 0,
    "title": "title"
}
'''
@app.route('/FunctionLearner/PlotAxis', methods=['POST'])
def plot_axis():
    content = request.json

    function_learners[content['learnerId']].plot_axis(
        x=np.random.uniform(content['low'], content['high'], content['size']),
        axis=content['axis'],
        title=content['title'])

    return plot_to_image()

def plot_to_image():
    img = BytesIO()
    plt.savefig(img, format='png')
    plt.close()
    img.seek(0)
    plot_url = str(base64.b64encode(img.getvalue())).lstrip('b').strip("'")
    return f'<img src="data:image/png;base64,{plot_url}">'


if __name__ == '__main__':
    app.run(debug=True)