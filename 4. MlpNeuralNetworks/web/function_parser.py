import numpy as np
from sympy.parsing.latex import parse_latex

functions = {
    'sin': np.sin,
    'cos': np.cos,
    'log': np.log,
    'exp': np.exp
}


def parse_function(function):
    print(function)
    return eval(f"{make_lambda_prefix(function['parameters'])} {str(parse_latex(function['expression'])).replace(', 10', '')}", functions)

def make_lambda_prefix(parameters):
    result = 'lambda '
    for parameter in parameters[:-1]:
        result += f'{parameter}, '
    result += f'{parameters[-1]}:'
    return result