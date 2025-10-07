from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer  # For supervised fine-tuning
import torch

model_name = "mistralai/Mistral-7B-Instruct-v0.3"
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,  # Efficient precision
    device_map="auto",
    load_in_8bit=True
)

# QLoRA config
peft_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    inference_mode=False,
    r=16,  # Rank
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=["q_proj", "v_proj"]  # Mistral-specific
)
model = get_peft_model(model, peft_config)

# Tokenize dataset
def tokenize(examples):
    return tokenizer(examples["text"], truncation=True, max_length=512, padding="max_length")
tokenized_dataset = dataset.map(tokenize, batched=True)

# Training args
training_args = TrainingArguments(
    output_dir="./edu-mistral-finetuned",
    num_train_epochs=3,  # Adjust based on data size
    per_device_train_batch_size=2,  # Tune for your GPU
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    save_steps=500,
    logging_steps=100,
    evaluation_strategy="steps",
    eval_steps=500,
    warmup_steps=100,
    load_best_model_at_end=True
)

trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
    eval_dataset=tokenized_dataset["test"],
    tokenizer=tokenizer,
    peft_config=peft_config,
    dataset_text_field="text"  # Formatted prompt field
)

trainer.train()
trainer.save_model("./edu-mistral-finetuned")