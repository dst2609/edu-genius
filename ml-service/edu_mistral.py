# QLoRA (Quantized LoRA Low-Rank Adaptation) fine-tuning for Mistral-7B-Instruct-v0.3 using pure Transformers + PEFT (Parameter-Efficient Fine-Tuning) (no TRL).
# Requires: transformers, datasets, peft, bitsandbytes, torch (CUDA build)

import os
import logging
import torch
import pandas as pd
from inspect import signature

from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
    Trainer,
    set_seed,
)
from peft import LoraConfig, get_peft_model, TaskType
try:
    from peft import prepare_model_for_kbit_training
except Exception:
    prepare_model_for_kbit_training = None

# ----------------------------
# Config
# ----------------------------
MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.3"
# DATA_FILE = "dataset.csv"                # expects columns: instruction, output (others allowed)
DATA_FILE = "edu_instruct_dataset.csv"                # expects columns: instruction, output (others allowed)
OUTPUT_DIR = "./edu-mistral-finetuned"

NUM_EPOCHS = 3
PER_DEVICE_TRAIN_BATCH = 2
GRAD_ACCUM_STEPS = 4
LEARNING_RATE = 2e-4
MAX_SEQ_LENGTH = 512
EVAL_SPLIT = 0.1
SEED = 42

USE_BF16 = True                  #RTX 40-series
USE_GRADIENT_CHECKPOINTING = True
LOGGING_STEPS = 50
SAVE_STEPS = 500
EVAL_STEPS = 500
WARMUP_STEPS = 100
LR_SCHEDULER = "cosine"
WEIGHT_DECAY = 0.0

# ----------------------------
# Logging
# ----------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("edu-mistral-qlora-trainer")


def assert_cuda():
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU not detected. QLoRA requires a supported GPU.")
    logger.info(f"CUDA detected: {torch.version.cuda}")


def load_tokenizer(model_name: str):
    logger.info("Loading tokenizer...")
    tok = AutoTokenizer.from_pretrained(model_name, use_fast=True)
    # For causal LM, pad token should be eos; right padding
    tok.pad_token = tok.eos_token
    tok.padding_side = "right"
    return tok


def load_4bit_model(model_name: str):
    logger.info("Loading 4-bit quantized base model (QLoRA ready)...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16 if USE_BF16 else torch.float16,
    )
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        device_map="auto",
        quantization_config=bnb_config,
        dtype=torch.bfloat16 if USE_BF16 else torch.float16,  # modern param name
        trust_remote_code=False,
    )
    model.config.use_cache = False
    return model


def _read_csv_robust(path: str) -> pd.DataFrame:
    """Forgiving CSV reader that tolerates stray commas/quotes and extra columns."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"CSV not found at: {path}")
    try:
        df = pd.read_csv(
            path,
            engine="python",
            sep=None,               # infer delimiter
            on_bad_lines="skip",
            quotechar='"',
            escapechar="\\",
        )
    except Exception as e:
        logger.warning(f"Primary read failed ({e}). Retrying with sep=',' fallback...")
        df = pd.read_csv(
            path, engine="python", sep=",", on_bad_lines="skip", quotechar='"', escapechar="\\"
        )

    df.columns = [str(c).strip().lower() for c in df.columns]

    if "instruction" in df.columns and "output" in df.columns:
        keep = df[["instruction", "output"]].copy()
    else:
        if len(df.columns) == 0:
            raise ValueError("CSV appears empty or unreadable after parsing.")
        instr_col = df.columns[0]
        other_cols = [c for c in df.columns if c != instr_col]
        if not other_cols:
            logger.warning("Only one column found; treating it as 'instruction' and leaving 'output' empty.")
            keep = pd.DataFrame({"instruction": df[instr_col].astype(str), "output": ""})
        else:
            keep = pd.DataFrame({
                "instruction": df[instr_col].astype(str),
                "output": df[other_cols].astype(str).apply(
                    lambda r: ", ".join([x for x in r if x and x != "nan"]), axis=1
                ),
            })

    keep["instruction"] = keep["instruction"].fillna("").astype(str).str.strip()
    keep["output"] = keep["output"].fillna("").astype(str).str.strip()

    before = len(keep)
    keep = keep[(keep["instruction"] != "") & (keep["output"] != "")]
    dropped = before - len(keep)
    if dropped > 0:
        logger.info(f"Dropped {dropped} empty/invalid rows.")
    if len(keep) == 0:
        raise ValueError("No valid (instruction, output) rows found after cleaning.")
    return keep


def load_and_prepare_text_dataset(data_file: str):
    logger.info(f"Loading dataset from {data_file} ...")
    df = _read_csv_robust(data_file)

    def fmt_row(row):
        return f"<s>[INST] {row['instruction'].strip()} [/INST] {row['output'].strip()}</s>"

    logger.info("Formatting dataset into 'text' field...")
    df["text"] = df.apply(fmt_row, axis=1)

    full_ds = Dataset.from_pandas(df[["text"]], preserve_index=False)

    total = len(full_ds)
    eval_size = max(1, int(total * EVAL_SPLIT))
    train_size = total - eval_size
    ds_train = full_ds.select(range(train_size))
    ds_eval = full_ds.select(range(train_size, total))

    logger.info(f"Train size: {len(ds_train)} | Eval size: {len(ds_eval)}")
    return {"train": ds_train, "test": ds_eval}


def tokenize_datasets(dsets, tokenizer):
    logger.info("Tokenizing datasets...")

    def tok_fn(batch):
        out = tokenizer(
            batch["text"],
            truncation=True,
            max_length=MAX_SEQ_LENGTH,
            padding=False,  # pad later in collator
            return_attention_mask=True,
        )
        return out

    train_tok = dsets["train"].map(tok_fn, batched=True, remove_columns=["text"])
    eval_tok = dsets["test"].map(tok_fn, batched=True, remove_columns=["text"])

    # Trainer expects labels; DataCollatorForLanguageModeling will handle labels if absent,
    # but some versions prefer labels present. Collator create labels.
    return {"train": train_tok, "test": eval_tok}


def build_peft_model(model):
    # Prepare for k-bit training if available
    if prepare_model_for_kbit_training is not None:
        model = prepare_model_for_kbit_training(model)
    peft_cfg = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.1,
        target_modules=["q_proj", "v_proj"],  # Mistral-compatible
    )
    model = get_peft_model(model, peft_cfg)
    try:
        model.print_trainable_parameters()
    except Exception:
        pass
    return model


def build_training_args():
    kwargs = dict(
        output_dir=OUTPUT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=PER_DEVICE_TRAIN_BATCH,
        gradient_accumulation_steps=GRAD_ACCUM_STEPS,
        learning_rate=LEARNING_RATE,
        bf16=USE_BF16,
        fp16=not USE_BF16,
        logging_steps=LOGGING_STEPS,
        save_steps=SAVE_STEPS,
        eval_steps=EVAL_STEPS,
        warmup_steps=WARMUP_STEPS,
        lr_scheduler_type=LR_SCHEDULER,
        save_total_limit=2,
        report_to="none",
        gradient_checkpointing=USE_GRADIENT_CHECKPOINTING,
        load_best_model_at_end=True,
        weight_decay=WEIGHT_DECAY,
    )
    # Handle eval/evaluation_strategy rename
    sig = signature(TrainingArguments.__init__)
    kwargs["eval_strategy" if "eval_strategy" in sig.parameters else "evaluation_strategy"] = "steps"
    return TrainingArguments(**kwargs)


def quick_test_inference(model, tokenizer):
    logger.info("Testing inference with a sample prompt...")

    # Use the same instruction style trained on
    user_query = "Explain Newton's first law for 10th grade CBSE physics."
    # user_query = "Find the LCM of 26 and 169."
    prompt = f"<s>[INST] {user_query} [/INST]"

    model.eval()
    device = model.device
    ins = tokenizer(prompt, return_tensors="pt").to(device)

    # Helpful generation settings
    gen_kwargs = dict(
        max_new_tokens=200,
        do_sample=True,          # allow some creativity
        temperature=0.7,
        top_p=0.9,
        num_beams=1,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
    )

    with torch.no_grad():
        gen = model.generate(**ins, **gen_kwargs)

    # Try a "clean" decode (special tokens removed)
    clean = tokenizer.decode(gen[0], skip_special_tokens=True).strip()

    # If clean is empty, show raw decode for debugging
    if not clean:
        raw = tokenizer.decode(gen[0], skip_special_tokens=False)
        print("\n=== SAMPLE OUTPUT (raw, incl. special tokens) ===\n")
        print(raw)
        print("\n=================================================\n")
        return

    # Print a preview (first ~350 chars)
    preview = clean[:350].replace("\n", " ")
    print("\n=== SAMPLE OUTPUT (preview) ===\n")
    print(preview + ("..." if len(clean) > 350 else ""))

    # Then print the complete answer (no truncation)
    print("\n=== FULL OUTPUT (complete) ===\n")
    print(clean)
    print("\n==============================\n")



def main():
    set_seed(SEED)
    assert_cuda()

    tokenizer = load_tokenizer(MODEL_NAME)
    base_model = load_4bit_model(MODEL_NAME)
    model = build_peft_model(base_model)

    dsets_text = load_and_prepare_text_dataset(DATA_FILE)
    dsets_tok = tokenize_datasets(dsets_text, tokenizer)

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    training_args = build_training_args()

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dsets_tok["train"],
        eval_dataset=dsets_tok["test"],
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    logger.info("Starting training...")
    trainer.train()

    logger.info(f"Saving LoRA adapters and tokenizer to {OUTPUT_DIR} ...")
    trainer.save_model(OUTPUT_DIR)          # saves PEFT adapters
    tokenizer.save_pretrained(OUTPUT_DIR)

    quick_test_inference(trainer.model, tokenizer)
    logger.info("Done.")


if __name__ == "__main__":
    main()



"""
| Component               | Role in pipeline                               | File / Code piece                                   |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------- |
| **Base model**          | Pre-trained Mistral 7B                         | `"mistralai/Mistral-7B-Instruct-v0.3"`              |
| **PEFT / LoRA adapter** | The small trainable layers                     | `adapter_model.bin` inside `edu-mistral-finetuned/` |
| **QLoRA quantization**  | Loads the base model in 4-bit for VRAM savings | `BitsAndBytesConfig(load_in_4bit=True)`             |
| **PEFT library**        | Handles attaching/merging LoRA adapters        | `from peft import PeftModel, get_peft_model`        |

"""
