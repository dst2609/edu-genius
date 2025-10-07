import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer
from datasets import load_dataset  # Explicit import for datasets
import logging

# Set up logging to see progress and debug issues
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Step 1: Load the base model and tokenizer
logger.info("Loading Mistral-7B-Instruct-v0.3 model and tokenizer...")
model_name = "mistralai/Mistral-7B-Instruct-v0.3"
try:
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token  # Set pad token
    print("Tokenizer loaded successfully.")
    
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.bfloat16,  # Efficient precision
        device_map="auto",  # Auto-map to GPU/CPU
        load_in_8bit=True  # 8-bit quantization for lower VRAM
    )
    print("Model loaded successfully.")
except Exception as e:
    logger.error(f"Error loading model/tokenizer: {e}")
    raise

# Step 2: Load and prepare the dataset
logger.info("Loading dataset from dataset.csv...")
try:
    dataset = load_dataset("csv", data_files="dataset.csv", split="train")
    print(f"Dataset loaded with {len(dataset)} examples.")
except Exception as e:
    logger.error(f"Error loading dataset: {e}")
    raise

# Format dataset for Mistral's instruction tuning
def format_prompt(example):
    return f"<s>[INST] {example['instruction']} [/INST] {example['output']} </s>"

logger.info("Formatting dataset prompts...")
dataset = dataset.map(lambda x: {"text": format_prompt(x)}, num_proc=4)
print("Dataset formatting complete.")

# Split dataset into train and eval
logger.info("Splitting dataset into train and eval sets...")
dataset = dataset.train_test_split(test_size=0.1)  # 90% train, 10% eval
print(f"Training set size: {len(dataset['train'])}, Eval set size: {len(dataset['test'])}")

# Step 3: Tokenize the dataset
def tokenize(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=512,
        padding="max_length"
    )

logger.info("Tokenizing dataset...")
tokenized_dataset = dataset.map(tokenize, batched=True, remove_columns=["text", "instruction", "output"])
print("Dataset tokenization complete.")

# Step 4: Configure QLoRA for efficient fine-tuning
logger.info("Setting up QLoRA configuration...")
peft_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    inference_mode=False,
    r=16,  # LoRA rank
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=["q_proj", "v_proj"]  # Mistral-specific
)
model = get_peft_model(model, peft_config)
print("QLoRA configuration applied.")

# Step 5: Set up training arguments
logger.info("Configuring training arguments...")
training_args = TrainingArguments(
    output_dir="./edu-mistral-finetuned",
    num_train_epochs=3,
    per_device_train_batch_size=2,  # Adjust if GPU memory is low
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    save_steps=500,
    logging_steps=100,
    evaluation_strategy="steps",
    eval_steps=500,
    warmup_steps=100,
    load_best_model_at_end=True,
    logging_dir="./edu-mistral-finetuned/logs"
)

# Step 6: Initialize trainer and start training
logger.info("Initializing SFTTrainer...")
trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"],
    tokenizer=tokenizer,
    peft_config=peft_config,
    dataset_text_field="text"  # Field used in formatting
)

logger.info("Starting training...")
try:
    trainer.train()
    print("Training completed successfully.")
except Exception as e:
    logger.error(f"Training failed: {e}")
    raise

# Step 7: Save the fine-tuned model
logger.info("Saving fine-tuned model...")
trainer.save_model("./edu-mistral-finetuned")
print("Model saved to ./edu-mistral-finetuned.")

# Step 8: Test inference with a sample prompt
logger.info("Testing inference with sample prompt...")
test_prompt = "Explain Newton's first law for 10th grade CBSE physics."
inputs = tokenizer(test_prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")
outputs = model.generate(**inputs, max_new_tokens=200)
print("Sample output:", tokenizer.decode(outputs[0], skip_special_tokens=True))