import sys, getopt
from time import time
import numpy as np
import pandas as pd
from PIL import Image

import tensorflow
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Reshape, concatenate, Dropout
from tensorflow.keras.applications.inception_v3 import InceptionV3
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import Model
from tensorflow.keras.applications.inception_v3 import preprocess_input

def define_model():
  model = Sequential()
  model.add(Dense(256, activation='relu', input_dim = 2048))
  model.add(Dropout(0.4))
  model.add(Dense(256, activation = 'relu'))
  model.add(Dropout(0.3))
  model.add(Dense(1, activation='sigmoid'))
  return model

model = define_model()

model.compile(optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy'])

model.load_weights('static/models/my_model.h5')

model_new = InceptionV3()
model_new = Model(model_new.input, model_new.layers[-2].output)
model_new.load_weights('static/models/inception.h5')

def preprocess(image_path):
    img = image.load_img(image_path, target_size=(299, 299))
    
    x = image.img_to_array(img)

    x = np.expand_dims(x, axis=0)
    
    x = preprocess_input(x)
    return x

def encode(image):
    image = preprocess(image) 
    v = model_new.predict(image) 
    v = np.reshape(v, v.shape[1]) 
    return v

def make_prediction(filename):
  #x = plt.imread(filename)
  #plt.imshow(x)
  v = encode(filename)
  # v = v.astype('float32')
  # v /= 255
  pred =  model.predict(v.reshape(1, v.shape[0]))
  if(pred[0] == 1):
    print("Garbage found")
  else:
  	print("No Garbage found")


def compute(argv):
    make_prediction(argv)

if __name__ == "__main__":
    compute(sys.argv[1])