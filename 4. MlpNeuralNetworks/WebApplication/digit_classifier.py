import keras
import matplotlib.pyplot as plt
from keras.models import Sequential, load_model
from keras.layers.core import Dense, Dropout, Activation
import numpy as np
from skimage.transform import resize

def draw(image):
    fig = plt.figure(figsize=(4, 4))
    ax = fig.add_subplot(111)
    ax.set_aspect('equal')
    ax.get_xaxis().set_visible(False)
    ax.get_yaxis().set_visible(False)

    plt.imshow(image.reshape(28, 28) * 255)

    cax = fig.add_axes([0.12, 0.1, 0.78, 0.8])
    cax.get_xaxis().set_visible(False)
    cax.get_yaxis().set_visible(False)
    cax.set_frame_on(False)
    plt.savefig("fig.png")

def create_model():
    digitClassifier = Sequential()
    digitClassifier.add(Dense(512, input_dim=28 * 28, activation='relu'))
    digitClassifier.add(Dropout(0.2))
    digitClassifier.add(Dense(512, activation='relu'))
    digitClassifier.add(Dropout(0.2))
    digitClassifier.add(Dense(10, activation='softmax'))
    digitClassifier.compile(loss='categorical_crossentropy', metrics=[
                            'accuracy'], optimizer='adam')
    digitClassifier.load_weights('digit_classifier_weights')
    return digitClassifier


def classify(points, width, height):
    image = np.zeros((width, height))
    for point in points:
        image[point[1]][point[0]] = 1

    image = resize(image, (28, 28))
    image = image.reshape(1, 28 * 28)

    return digit_classifier.predict(image).reshape(10).tolist()

digit_classifier = create_model()
