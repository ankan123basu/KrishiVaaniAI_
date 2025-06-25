import io
import torch
from torchvision import models, transforms
from PIL import Image
import io
import json
import os

from ts.torch_handler.base_handler import BaseHandler

class LeafDiseaseHandler(BaseHandler):
    def __init__(self, *args, **kwargs):
        super().__init__()
        self.model = None
        self.index_to_name = None
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def initialize(self, ctx):
        model_dir = ctx.system_properties.get("model_dir")
        model_pt = os.path.join(model_dir, "mobilenetv2_leaf_disease_final.pth")
        mapping = os.path.join(model_dir, "index_to_name.json")
        
        # First load the state dict to check the number of classes
        state_dict = torch.load(model_pt, map_location=torch.device('cpu'))
        
        # Create a new state dict without the 'module.' prefix
        new_state_dict = {}
        for k, v in state_dict.items():
            name = k.replace('module.', '')  # remove 'module.' prefix if present
            new_state_dict[name] = v
        
        # Get the number of classes from the classifier.1.weight shape [num_classes, 1280]
        num_classes = new_state_dict['classifier.1.weight'].shape[0]
        
        # Create a fresh MobileNetV2 model with the correct number of classes
        self.model = models.mobilenet_v2(weights=None, num_classes=num_classes)
        
        # Load the state dict with strict=False to handle any mismatched keys
        self.model.load_state_dict(new_state_dict, strict=False)
        self.model.eval()
        
        # Verify the model was loaded correctly
        if hasattr(self.model, 'classifier') and hasattr(self.model.classifier, '1'):
            print(f"Model loaded successfully with {num_classes} output classes")
        else:
            raise RuntimeError("Failed to properly initialize the model")
        
        # Load class mapping
        with open(mapping, "r") as f:
            self.index_to_name = json.load(f)
            print(f"Loaded class mapping with {len(self.index_to_name)} classes")

    def preprocess(self, data):
        image_bytes = data[0].get('data') or data[0].get('body')
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = self.transform(image).unsqueeze(0)
        return input_tensor

    def inference(self, input_tensor):
        with torch.no_grad():
            outputs = self.model(input_tensor)
            _, pred = torch.max(outputs, 1)
            class_idx = pred.item()
            class_name = self.index_to_name.get(str(class_idx), 'Unknown')
        return class_name

    def postprocess(self, inference_output):
        return [{"class": inference_output, "remedy": "See KrishiVaani for remedy."}]

# Usage (for Flask backend, not for TorchServe directly):
# from torchserve_handler import LeafDiseaseHandler
# model = ... # load model
# handler = LeafDiseaseHandler(model, index_to_name)
# result = handler.predict(image_bytes)
