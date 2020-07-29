import numpy as np
import matplotlib.pyplot as plt
import keras
from keras.models import Sequential
from keras.layers import Dense
from keras.callbacks import LearningRateScheduler, Callback
from sklearn.preprocessing import MinMaxScaler
import inspect
from sys import stdout

class LossHistory(Callback):

    def __init__(self, learner):
        self.learner = learner
        self.epoch = 1

    def on_train_begin(self, logs={}):
        self.data = {'loss': [], 'lr': []}
    
    def on_epoch_end(self, batch, logs={}):
        self.data['loss'].append(logs.get('loss'))
        self.data['lr'].append(self.learner.lr)

        if self.epoch % 10 == 0:
            self.learner.print_status(self.epoch, logs.get('loss'))
        self.epoch += 1

class FunctionLearner:
    
    def __init__(self, train_data=None, function=None, data_size=None, train_domain_low=None, train_domain_high=None, neurons=[20, 20], noise_sigma=None):
        self.function = function
        self.feature_scaler = MinMaxScaler()
        self.target_scaler = MinMaxScaler()
        self.X, self.y = self.get_dataset(train_data, data_size, train_domain_low, train_domain_high, noise_sigma)
        self.model = self.create_model(neurons)
        self.lr = 0.01
        self.alpha = 0.9
    
    def get_feature_dimension(self):
        return len(inspect.signature(self.function).parameters)
    
    def get_dataset(self, data, size:int, low, high, noise_sigma):
        if data is not None:
            X = data[data.columns[:-1]].values
            y = data[data.columns[-1:]].values
            self.function = lambda x: y if x is X else None
        else:
            X, y = self.create_random_dataset(size, low, high, noise_sigma)

        self.feature_scaler.fit(X)
        self.target_scaler.fit(y)
        return X, y
    
    def create_random_dataset(self, size:int, low, high, noise_sigma):
        feature_shape = (size, self.get_feature_dimension())
        X = np.random.uniform(low, high, feature_shape)
        y = self.function(*X.T).reshape(size, 1)

        if noise_sigma:
            y += np.random.normal(scale=noise_sigma, size=(size, 1))
        return X, y

    def step_decay(self, epoch):
        if epoch % 500 == 0:
            self.lr *= 0.9
        return self.lr
    
    def create_model(self, neurons):
        model = Sequential()
        model.add(Dense(neurons[0], input_dim=self.get_feature_dimension(), activation='relu', kernel_initializer='he_uniform'))
        model.add(Dense(neurons[0], activation='relu', kernel_initializer='he_uniform'))
        model.add(Dense(1))

        opt = keras.optimizers.Adam(learning_rate=0.01)
        model.compile(optimizer=opt, loss='mse')
        return model

    def plot_axis(self, x, axis, title=None):
        plt.figure(figsize=(15, 10))

        if title:
            plt.title(title)
        
        plt.scatter(x[:, axis], self.predict(x).reshape(x.shape[0],) - self.function(*x.T), color='red', label='prediction error', s=5, zorder=1)
        plt.scatter(self.X[:, axis], self.y.reshape(self.X.shape[0],) - self.function(*self.X.T), color='green', label='train error', s=5, zorder=2)

        plt.grid()
        plt.legend()
    
    def plot_result(self, data=None, x=None, title=None, xlim=None, ylim=None):
        if self.get_feature_dimension() > 1:
            raise Exception("Cannot plot more than 2d")
            
        plt.figure(figsize=(15, 10))

        if title:
            plt.title(title)
        
        if data is not None:
            plt.scatter(data[data.columns[:-1]].values, data[data.columns[-1:]].values, color='skyblue', label='original', s=90, zorder=1)
            plt.scatter(self.X, self.y, color='green', label='train data', s=50, zorder=2)
            plt.scatter(data[data.columns[:-1]].values, self.predict(data[data.columns[:-1]].values), color='red', label='predicted', s=5, zorder=3)
        else:
            plt.scatter(x, self.function(x), color='skyblue', label='original', s=90, zorder=1)
            plt.scatter(self.X, self.y, color='green', label='train data', s=50, zorder=2)
            plt.scatter(x, self.predict(x), color='red', label='predicted', s=5, zorder=3)

        plt.grid()
        if xlim:
            plt.xlim(xlim)
        if ylim:
            plt.ylim(ylim)
        plt.legend()

    def plot_history(self, loss_ylim=None, lr_ylim=None):
        fig = plt.figure(figsize=(15, 5))
        ax = fig.add_subplot(1, 2, 1)
        ax.set_title('loss / epoch')
        plt.plot(self.loss_history.data['loss'], color='green', label='loss', linewidth=3, zorder=1)
        plt.grid()
        if loss_ylim:
            plt.ylim(loss_ylim)
        
        ax = fig.add_subplot(1, 2, 2)
        ax.set_title('learning rate / epoch')
        plt.plot(self.loss_history.data['lr'], color='green', label='lr', linewidth=3, zorder=1)
        plt.grid()
        if loss_ylim:
            plt.ylim(loss_ylim)
        
        plt.legend()
    
    def print_status(self, epoch, loss):
        stdout.write(f"\repoch: {epoch:4} - loss: {loss:.5e}")
        stdout.flush()
    
    def learn(self, epochs):
        learning_rate = LearningRateScheduler(self.step_decay)
        self.loss_history = LossHistory(self)

        self.model.fit(
            self.feature_scaler.transform(self.X), 
            self.target_scaler.transform(self.y), 
            batch_size=10, epochs=epochs, 
            callbacks=[self.loss_history, learning_rate], 
            verbose=0, validation_split=0.1)

        self.print_status(epochs, self.loss_history.data["loss"][-1])
        print()
    
    def mse(self, X, Y):
        return ((X - Y) ** 2).mean()

    def error(self, X=None, data=None):
        if data is not None:
            prediction = self.predict(data[data.columns[:-1]].values)
            return self.mse(prediction, data[data.columns[-1:]].values.reshape(prediction.shape))
        
        prediction = self.predict(X)
        return self.mse(prediction, self.function(*X.T).reshape(prediction.shape))
    
    def predict(self, X):
        return self.target_scaler.inverse_transform(
            self.model.predict(
                self.feature_scaler.transform(X)))
