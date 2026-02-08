import tensorflow as tf
import numpy as np
from PIL import Image
import os
import io

class ModelService:
    def __init__(self, model_path: str, labels_path: str):
        self.model_path = model_path
        self.labels_path = labels_path
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        self.labels = []
        self._load_model()
        self._load_labels()

    def _load_model(self):
        try:
            print(f"Loading model from {self.model_path}")
            self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
            self.interpreter.allocate_tensors()
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            print("Model loaded successfully")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e

    def _load_labels(self):
        try:
            with open(self.labels_path, 'r') as f:
                # Assuming format "0 Labelname" or just "Labelname"
                # Based on previous view_file, it's "0 Smartphone"
                self.labels = [line.strip().split(' ', 1)[1] for line in f.readlines()]
            print(f"Labels loaded: {self.labels}")
        except Exception as e:
            print(f"Error loading labels: {e}")
            self.labels = ["Unknown"]

    def preprocess_image(self, image_data: bytes):
        """
        Resize and normalize image for the model.
        """
        try:
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
            
            # Get input shape from model details
            input_shape = self.input_details[0]['shape']
            height = input_shape[1]
            width = input_shape[2]
            
            image = image.resize((width, height))
            input_data = np.array(image, dtype=np.float32)
            
            # Add batch dimension
            input_data = np.expand_dims(input_data, axis=0)
            
            # Normalize if required (usually 0-255 -> 0-1 or -1 to 1)
            # Defaulting to 0-255 -> 0-1 as common in TFLite converted from Keras
            # If the model expects 0-255, this might need adjustment.
            # Usually TFLite image models expect normalized inputs.
            input_data = input_data / 255.0
            
            return input_data
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            raise e

    def predict(self, image_data: bytes):
        if not self.interpreter:
            raise Exception("Model not initialized")

        input_data = self.preprocess_image(image_data)
        
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        self.interpreter.invoke()
        
        output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
        probs = output_data[0] # Probability array
        
        # Get top prediction
        top_index = np.argmax(probs)
        confidence = float(probs[top_index])
        label = self.labels[top_index] if top_index < len(self.labels) else "Unknown"
        
        return {
            "label": label,
            "confidence": confidence,
            "all_predictions": {self.labels[i]: float(probs[i]) for i in range(len(self.labels))} if len(self.labels) == len(probs) else {}
        }

# Singleton instance to be used by API
# Paths are relative to backend/ execution context or absolute
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "../converted_tflite/model_unquant.tflite")
LABELS_PATH = os.path.join(BASE_DIR, "../converted_tflite/labels.txt")

model_service = ModelService(MODEL_PATH, LABELS_PATH)
