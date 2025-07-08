# Optimizing Qwen-2.5 with Intel OpenVINO

This guide demonstrates how to optimize and accelerate the Qwen-2.5 model using Intel's OpenVINO toolkit. The project shows how to make a large language model run more efficiently on standard CPU hardware.

### The optimized model has been pushed to Hugging Face (Link below)
[Hugging Face - Qwen-2.5-7B-Optimized-int8](https://huggingface.co/minorityhunter/Qwen-2.5-7B-Optimized-int8)
## What is OpenVINO?
OpenVINO (Open Visual Inference & Neural network Optimization) is Intel's toolkit designed to help developers and data scientists accelerate AI workloads. It optimizes models to run efficiently on Intel hardware, including CPUs, integrated GPUs, VPUs, and FPGAs.

## What This Project Does

This project demonstrates how to:

1. Load the Qwen-2.5 7B  model from Hugging Face
2. Benchmark its performance
3. Optimize the model using OpenVINO with INT8 quantization
4. Compare the performance before and after optimization

The optimization reduces model size by 53.25% and improves latency by 72.52%, providing significant performance benefits without specialized hardware.

## Prerequisites

Before you begin, make sure you have:

- Python 3.8 or newer
- Your Hugging Face access token
- At least 16GB of RAM (Suggested to Use Google Colab )

## Installation

Install the required packages:
```bash
pip install --upgrade optimum[openvino] transformers accelerate huggingface_hub
```

## Setting Up Hugging Face Access

1. Create a Hugging Face account if you don't have one
3. Create an access token at Hugging Face Settings
4. Use your token in the notebook:
   ```python
   from huggingface_hub import login
   login("your_hugging_face_token_here")
   ```

## Running the Project

Open and run the `OpenVinoQwen.ipynb` notebook. The notebook will:
- Install required packages
- Load the original model
- Benchmark it
- Optimize it with OpenVINO
- Benchmark the optimized model
- Generate comparison charts

## Understanding the Process

### 1. Loading the Original Model

```python
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    device_map="auto",
    torch_dtype="auto"
)
```

### 2. Optimizing with OpenVINO

```python
!optimum-cli export openvino \
    --model $MODEL_ID \
    --task text-generation-with-past \
    --weight-format int8 \
    $OV_DIR
```

This command exports the model to OpenVINO format, applies INT8 quantization, and saves the optimized model.

### 3. Using the Optimized Model

```python
ov_model = OVModelForCausalLM.from_pretrained(OV_DIR)
ov_tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
pipe = pipeline("text-generation", model=ov_model, tokenizer=ov_tokenizer, device=-1)
```

## Performance Benefits

The optimization provides:
- 53.25% reduction in model size
- 72.52% improvement in inference latency
- Similar output quality to the original model

## Troubleshooting

### Common Issues:

1. **Out of Memory Errors**
   - Try using a smaller model variant
   - Close other memory-intensive applications

2. **Slow First Inference**
   - This is normal as the first run includes compilation time
   - Subsequent runs will be faster

## Learn More

- [OpenVINO Documentation](https://docs.openvino.ai/)
- [Optimum Intel Documentation](https://huggingface.co/docs/optimum/intel/index)