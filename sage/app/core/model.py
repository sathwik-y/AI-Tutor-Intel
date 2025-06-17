from optimum.intel.openvino import OVModelForCausalLM
from transformers import AutoTokenizer
import os
import re
import torch

MODEL_PATH = os.path.join("models", "qwen2.5-optimized")

# Load model and tokenizer with optimization settings
model = OVModelForCausalLM.from_pretrained(
    MODEL_PATH,
    device="CPU",
    ov_config={"PERFORMANCE_HINT": "THROUGHPUT", "NUM_STREAMS": "1"}
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)

# Set padding token if not already set
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

def generate_from_model(prompt: str):
    """Generate response from Qwen2.5 model with proper configuration"""
    
    # Format prompt properly for Qwen2.5
    formatted_prompt = f"<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
    
    # Tokenize input with increased context window
    inputs = tokenizer(formatted_prompt, return_tensors="pt", padding=True, truncation=True, max_length=4096)
    prompt_tokens = inputs['input_ids'].shape[1]
    print(f"Prompt tokens: {prompt_tokens}")
    
    # Generate with improved parameters for better responses
    outputs = model.generate(
        **inputs,
        max_new_tokens=1024,
        do_sample=True,
        temperature=0.8,
        top_p=0.95,
        top_k=40,
        repetition_penalty=1.02,
        pad_token_id=tokenizer.pad_token_id,
        eos_token_id=tokenizer.eos_token_id,
        use_cache=True,
        output_scores=False,
        return_dict_in_generate=False
    )
    
    # Decode response
    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract only the assistant's response more carefully
    if "<|im_start|>assistant\n" in full_response:
        # Split and get everything after the assistant marker
        parts = full_response.split("<|im_start|>assistant\n")
        if len(parts) > 1:
            answer = parts[-1]
        else:
            answer = full_response
    else:
        # Fallback: remove the original prompt
        answer = full_response.replace(formatted_prompt, "", 1).strip()
    
    # Clean up response
    answer = answer.replace("<|im_end|>", "").strip()
    
    # Debug logging
    print(f"Full response length: {len(full_response)}")
    print(f"Extracted answer length: {len(answer)}")
    print(f"Answer preview: {answer[:100]}...")
    
    # Fix common tokenization/generation artifacts
    answer = re.sub(r'\s+', ' ', answer)  # Normalize whitespace
    answer = re.sub(r'(\d+)\s*,\s*(\d+)', r'\1,\2', answer)  # Fix comma spacing in numbers
    answer = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', answer)  # Fix sentence spacing
    
    # Remove any trailing incomplete words or punctuation artifacts
    answer = re.sub(r'\s+([.,;:!?])', r'\1', answer)  # Fix punctuation spacing
    
    return answer.strip()
