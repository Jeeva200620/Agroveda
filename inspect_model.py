import tensorflow as tf
import sys

def inspect_model(model_path):
    try:
        model = tf.keras.models.load_model(model_path, compile=False)
        print("Model Loaded Successfully!")
        print(f"Model Summary:")
        model.summary()
        
        print("\nInput layers:")
        for i, in_layer in enumerate(model.inputs):
            print(f"  Input {i}: shape={in_layer.shape}, dtype={in_layer.dtype}")
            
        print("\nOutput layers:")
        for i, out_layer in enumerate(model.outputs):
            print(f"  Output {i}: shape={out_layer.shape}, dtype={out_layer.dtype}")
            
        # Try to guess classes if the output shape is known
        if len(model.outputs) == 1:
            out_shape = model.outputs[0].shape
            if out_shape is not None and len(out_shape) == 2:
                print(f"Number of classes: {out_shape[1]}")
                
    except Exception as e:
        print(f"Error loading model: {e}")

if __name__ == "__main__":
    inspect_model("agroveda_crop_model.h5")
