import numpy as np

functions = {
    'sin': np.sin,
    'cos': np.cos,
    'log': np.log,
    'exp': np.exp
}


def parse_function(function):
    return eval(f"{make_lambda_prefix(function['parameters'])} {function['expression']}", functions)

def make_lambda_prefix(parameters):
    result = 'lambda '
    for parameter in parameters[:-1]:
        result += f'{parameter}, '
    result += f'{parameters[-1]}:'
    return result