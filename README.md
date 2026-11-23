# AICD-MultiView: Multi-View Representation Learning with Agentic Forensics and Multi-Agent Debate for Robust AI-Generated Code Attribution

> **Comprehensive Research Specification & Technical Reference Document**
> *Targeted for Academic Publication (IEEE Transactions on Software Engineering / ACM TOSEM / NeurIPS / ACL / ICSE).*
> *Prepared for automated paper synthesis via LLMs (Claude 3.7 Sonnet / GPT-4o / Gemini 1.5 Pro).*

---

## Executive Summary & Research Abstract

The proliferation of Large Language Models (LLMs) capable of generating complex source code (e.g., GPT-4, Claude 3.5, Gemini 1.5, DeepSeek-Coder, LLaMA-Code) has precipitated urgent integrity, security, and licensing challenges in software engineering. Existing AI-code detectors predominantly rely on either:

1. Flat sequence token classification (e.g., standard CodeBERT/RoBERTa), which fails under token renamings, comment stripping, or minor control-flow perturbations; or
2. Black-box statistical metrics (e.g., perplexity, entropy, burstiness), which lack actionable interpretability and cannot distinguish human-AI collaborative ("Hybrid") or disguised ("Adversarial") code.

**AICD-MultiView** introduces a novel, three-tier hybrid architecture combining:

1. **Tri-View Deep Representation Learning**: A frozen ModernBERT-base encoder coupled with specialized linear projection heads that independently capture logic (`main_code`), modular decomposition (`sub_functions`), and semantic/stylistic documentation (`comments_view`), fused into a unified dense representation for 4-class classification (`Human`, `Machine`, `Hybrid`, `Adversarial`).
2. **Line-Level Counterfactual Explainability (XAI)**: A mathematically principled attribution engine that computes exact marginal prediction shifts under single-line counterfactual occlusion, providing line-level attribution without token-mapping heuristics.
3. **Conditional Model-Family Attribution**: A staged hierarchical taxonomy wherein LLM-family classification (e.g., GPT-4, Claude, LLaMA, DeepSeek) is conditionally activated **strictly** when the primary classifier predicts `Machine` (omitting attribution to preserve forensic clarity).
4. **Tool-Equipped Multi-Agent Forensics**: Two independent local forensic agents—**Agent A** (Comment & Identifier Stylistics) and **Agent B** (AST & Cyclomatic Complexity)—that interrogate the preprocessed and splitted source code views (not embeddings) via deterministic AST parsers and metrics engines, citing verified execution substrings.
5. **Deterministic Consensus Aggregation & Confidence Gating**: An analytical decision engine ($50\%$ ML, $25\%$ Agent A, $25\%$ Agent B) paired with an entropy/confidence gate ($\tau = 0.70$, agreement check).
6. **Multi-Round Model Council Debate (3 LLMs)**: When confidence is marginal or agent signals conflict, an autonomous multi-agent debate loop is triggered featuring three specialized external LLM roles: the **Advocate** (arguing Machine generation), the **Skeptic** (arguing Human craftsmanship), and the **Presiding Judge** (impartially weighing evidence against source lines to deliver the final verdict).

---

## 1. Research Motivation & Problem Formulation

### 1.1 The Source Code Attribution Problem

Let $\mathcal{C}$ denote the space of syntactically valid source code across programming languages $\mathcal{L} \in \{\text{Python}, \text{Java}, \text{C++}, \text{JavaScript}, \text{Go}, \dots\}$. The goal of primary attribution is to learn a mapping:

$$
f_{\text{primary}}: \mathcal{C} \to \Delta^3
$$

where $\Delta^3 = \{ (p_1, p_2, p_3, p_4) \in [0, 1]^4 \mid \sum p_i = 1 \}$ represents the probability simplex over the 4 canonical origin classes:

$$
\mathcal{Y}_4 = \{ \text{Human}, \text{Machine}, \text{Hybrid}, \text{Adversarial} \}
$$

- **Human**: Authored organically by human engineers, characterized by natural cognitive variance, variable naming entropy, idiomatic shortcuts, and organic commenting patterns.
- **Machine**: Synthesized purely by generative LLMs, exhibiting high structural predictability, textbook documentation, uniform indentation, and low lexical burstiness.
- **Hybrid**: Collaborative code where an LLM generated a skeleton modified by a human, or human scaffolding filled in by Copilot/Cursor (mixed stylistic and complexity signals).
- **Adversarial**: Machine-generated code systematically obfuscated (dead-code injection, variable scrambling, synonym substitution, prompt-injected stylistic disguises) to deceive AI detectors.

### 1.2 The Staged Conditional Model-Family Attribution Problem

If and only if the predicted origin class is `Machine`:

$$
\hat{y}_{\text{primary}} = \arg\max_{c \in \mathcal{Y}_4} P(Y=c \mid \mathcal{C}) = \text{Machine}
$$

the system activates a secondary hierarchical attribution head:

$$
f_{\text{family}}: \mathcal{C} \to \Delta^{|\mathcal{F}|-1}
$$

where $\mathcal{F} = \{ \text{GPT-4}, \text{Claude}, \text{LLaMA}, \text{DeepSeek}, \text{Gemini}, \text{Mistral} \}$. For all other classes ($\text{Human}, \text{Hybrid}, \text{Adversarial}$), family attribution is mathematically undefined and bypassed.

---

## 2. Overall System Architecture

### 2.1 Graph Architecture (Mermaid)

```mermaid
flowchart TD
    %% Styling definitions
    classDef inputNode fill:#384959,stroke:#88BDF2,stroke-width:2px,color:#ffffff;
    classDef pipelineBox fill:#1e293b,stroke:#6A89A7,stroke-width:1.5px,color:#ffffff;
    classDef mlNode fill:#0f172a,stroke:#38bdf8,stroke-width:1.5px,color:#ffffff;
    classDef agentNode fill:#064e3b,stroke:#34d399,stroke-width:1.5px,color:#ffffff;
    classDef aggNode fill:#1e1b4b,stroke:#818cf8,stroke-width:1.5px,color:#ffffff;
    classDef gateNode fill:#7c2d12,stroke:#fb923c,stroke-width:1.5px,color:#ffffff;
    classDef councilNode fill:#4c1d95,stroke:#c084fc,stroke-width:1.5px,color:#ffffff;
    classDef xaiNode fill:#14532d,stroke:#4ade80,stroke-width:1.5px,color:#ffffff;
    classDef outputNode fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff;

    %% 1. USER INPUT
    SRC["Source Code (User Input)"]:::inputNode

    %% 2. PIPELINE: 1. CODE REPRESENTATION (MULTI-VIEW)
    subgraph S1 ["1. Code Representation Pipeline (Multi-View)"]
        PRE["Preprocessing & Splitting\n(Clean, Normalize, Split)"]:::mlNode
      
        V_MAIN["main_code view"]:::mlNode
        V_SUB["sub_functions view"]:::mlNode
        V_COMM["comments_view"]:::mlNode

        M_BERT["ModernBERT (Frozen Encoder)\nShared 768-d"]:::mlNode

        E_MAIN["E_main (768-d)"]:::mlNode
        E_SUB["E_sub (768-d)"]:::mlNode
        E_COMM["E_comments (768-d)"]:::mlNode

        P_MAIN["Projection (768 -> 256)"]:::mlNode
        P_SUB["Projection (768 -> 256)"]:::mlNode
        P_COMM["Projection (768 -> 256)"]:::mlNode

        FUSION["Feature Fusion\n(256 + 256 + 256 = 768-d)"]:::mlNode
        MLP["4-Class Classifier (MLP)"]:::mlNode
        P_ML["4-Class Probabilities P_ml\n(Human, Machine, Hybrid, Adversarial)"]:::mlNode
    end

    %% 3. EXPLAINABILITY & CONDITIONAL FAMILY
    SHAP["SHAP / XAI (for 4-class)\nLine-level Counterfactual"]:::xaiNode
    ATTR["Source-Code Line Attribution\n(Signed Positive / Negative)"]:::xaiNode
    FAM_CLF["LLM-Family Classifier\n(Activated ONLY if P_ml = Machine)"]:::mlNode
    FAM_OUT["LLM Family Prediction\n(GPT-4, Claude, LLaMA, DeepSeek, etc.)"]:::outputNode

    %% 4. PIPELINE: 2. LOCAL FORENSIC AGENTS
    subgraph S2 ["2. Local Forensic Agents (Independent Forensics)"]
        AG_A["Agent A (Comment / Style)\n- Analyzes naming & comments\n- Tools: comments, casings, markers"]:::agentNode
        AG_B["Agent B (Structural / AST)\n- Analyzes syntax & complexity\n- Tools: AST depth, cyclomatic, Halstead"]:::agentNode
      
        OUT_A["Agent A Output\n(Evidence, Rationale, Score)"]:::agentNode
        OUT_B["Agent B Output\n(Evidence, Rationale, Score)"]:::agentNode
    end

    %% 5. PIPELINE: 3. AGGREGATOR
    subgraph S3 ["3. Deterministic Aggregator"]
        AGG["Weighted Combination Engine\nP_agg = 0.50*P_ml + 0.25*A + 0.25*B"]:::aggNode
        AGG_RES["Aggregated 4-Class Probabilities"]:::aggNode
    end

    %% 6. PIPELINE: 4. CONFIDENCE GATE
    subgraph S4 ["4. Dynamic Confidence Gate"]
        GATE["Confidence & Agreement Check\n(Threshold >= 0.70 & Consensus)"]:::gateNode
    end

    %% 7. COUNCIL DEBATE & FINAL OUTPUT
    FINAL_DIRECT["Final Prediction (4-Class)\n(Human, Machine, Hybrid, Adversarial)"]:::outputNode

    subgraph S5 ["LLM Model Council (3 LLMs Dispute Resolution)"]
        ADV["The Advocate (Groq / gpt-oss-20b)\nArgues Machine Origin"]:::councilNode
        SKP["The Skeptic (Gemini Flash)\nArgues Human Craftsmanship"]:::councilNode
        JUDGE["Presiding Judge (OpenRouter / Nemotron)\nWeighs Claims vs Source Lines"]:::councilNode
        DEBATE_FLOW["Multi-Round Deliberation\n- Round 1: Cross-Examination\n- Round 2: Rebuttal & Convergence Gap\n- Final: Binding Verdict"]:::councilNode
    end

    %% CONNECTIONS
    SRC --> PRE
    PRE --> V_MAIN
    PRE --> V_SUB
    PRE --> V_COMM

    %% ML Branch: Views to ModernBERT Embeddings
    V_MAIN --> M_BERT
    V_SUB --> M_BERT
    V_COMM --> M_BERT

    M_BERT --> E_MAIN
    M_BERT --> E_SUB
    M_BERT --> E_COMM

    E_MAIN --> P_MAIN
    E_SUB --> P_SUB
    E_COMM --> P_COMM

    P_MAIN --> FUSION
    P_SUB --> FUSION
    P_COMM --> FUSION

    %% Feature Fusion connects EXCLUSIVELY to 4-Class MLP
    FUSION --> MLP
    MLP --> P_ML

    %% XAI & Family branches
    MLP --> SHAP
    SHAP --> ATTR

    P_ML -- "If Machine" --> FAM_CLF
    FAM_CLF --> FAM_OUT

    %% Agent Branch: Input is SPLITTED CODE VIEWS from Preprocessing (NOT embeddings, NOT Feature Fusion)
    PRE -->|Splitted Code Views| AG_A
    PRE -->|Splitted Code Views| AG_B
    AG_A --> OUT_A
    AG_B --> OUT_B

    %% Connections to Deterministic Aggregator
    P_ML -->|50% weight| AGG
    OUT_A -->|25% weight| AGG
    OUT_B -->|25% weight| AGG
    AGG --> AGG_RES
    AGG_RES --> GATE

    %% Confidence Gate Outcomes
    GATE -- "High Confidence (>=0.70) & Agreement" --> FINAL_DIRECT
    GATE -- "Low Confidence (<0.70) or Disagreement" --> ADV
    GATE -- "Low Confidence (<0.70) or Disagreement" --> SKP
  
    ADV --> DEBATE_FLOW
    SKP --> DEBATE_FLOW
    DEBATE_FLOW --> JUDGE
    JUDGE --> FINAL_DIRECT
```

### 2.2 Text Pipeline Flowchart

```
                                  [ Raw Source Code Input C ]
                                               │
                                               ▼
                              [ Preprocessing & Code Splitting ]
                                 (Unicode NFC, Strip BOM, CRLF)
                                               │
                     ┌─────────────────────────┴─────────────────────────┐
                     │                                                   │
                     ▼ (Splitted Code Views)                             ▼ (Splitted Code Views)
         ┌───────────────────────┐                           ┌───────────────────────┐
         │ 1. Multi-View Views   │                           │ 2. Local Agents       │
         │ - main_code           │                           │ - Agent A (Style)     │
         │ - sub_functions       │                           │ - Agent B (AST/Struct)│
         │ - comments_view       │                           └───────────┬───────────┘
         └───────────┬───────────┘                                       │
                     │                                                   │ (Agent A & B Outputs)
                     ▼                                                   │
         [ ModernBERT Frozen Encoder ]                                   │
                     │ (E_main, E_sub, E_comm: 768-d)                    │
                     ▼                                                   │
         [ 768 -> 256 Projections ]                                      │
                     │ (3 x 256-d)                                       │
                     ▼                                                   │
         [ 768-d Feature Fusion ]                                        │
                     │ (Strictly connects ONLY to Classifier)            │
                     ▼                                                   │
         [ 4-Class Classifier (MLP) ]                                    │
                     │                                                   │
                     ▼                                                   │
         [ 4-Class Probabilities P_ml ]                                  │
          ├──> [ SHAP / XAI Line Attribution ]                           │
          ├──> [ If Machine -> LLM-Family Classifier ]                   │
          └──> (50% weight)                                              │
                     │                                                   │
                     └─────────────────────────┬─────────────────────────┘
                                               │
                                               ▼
                              [ 3. Deterministic Aggregator Engine ]
                               P_agg = 0.50*P_ml + 0.25*P_A + 0.25*P_B
                                               │
                                               ▼
                                   [ 4. Dynamic Confidence Gate ]
                         Condition: max(P_agg) ≥ 0.70  AND  Consensus Agreement
                                               │
                                ┌──────────────┴──────────────┐
                                │                             │
                            [ PASSED ]                    [ FAILED ]
                                │                             │
                                ▼                             ▼
                         Direct Final Output       [ The LLM Model Council (3 LLMs) ]
                                                   - Advocate (Argues Machine Generation)
                                                   - Skeptic (Argues Human Craftsmanship)
                                                   - Presiding Judge (Impartial Deliberation)
                                                   - Round 1: Cross-Exam & Convergence Gap
                                                   - Round 2: Rebuttal & Counter-Arguments
                                                   - Final: Binding Verdict & Rationales
                                                              │
                                                              ▼
                                                   Consensus Verdict & Rationale
```

---

## 3. Tri-View Representation & Deep Learning Pipeline

### 3.1 Motivation for Multi-View Decomposition

Standard transformer encoders encode code as a flat token stream. However, code exhibits orthogonal modalities:

1. **Algorithmic Flow**: Loops, conditionality, arithmetic.
2. **Modular Organization**: Helper functions, recursion, lambda expressions.
3. **Intent Documentation**: Inline comments, docstrings, licensing headers.

LLMs frequently generate syntactically pristine algorithms but hallucinate unusual comment styles or over-document trivial statements. Conversely, human developers write messy, informal comments but highly modular subroutines. Separating code into three distinct views isolates these forensic signals.

### 3.2 View Extraction Algorithms

Given source file $\mathcal{C}$:

- **View 1 ($\mathcal{C}_{\text{main}}$)**: Top-level control flow, entry-point scripts (`if __name__ == '__main__':`, `main()`), and global variable definitions. Sub-function bodies are replaced with single-line structural stubs.
- **View 2 ($\mathcal{C}_{\text{sub}}$)**: Concatenation of all declared helper functions, sub-methods, and class member definitions, stripped of top-level scripts.
- **View 3 ($\mathcal{C}_{\text{comm}}$)**: Isolated extraction of block comments, docstrings (`"""..."""`), and single-line annotations (`#`, `//`), stripped of executable syntax.

If a view is empty (e.g., code without comments), a sentinel token `"<empty_view>"` is injected to preserve stable geometric embeddings.

### 3.3 ModernBERT-Base Backbone

ModernBERT (`answerdotai/ModernBERT-base`, 149M parameters) is employed as the frozen foundation encoder:

- **Architecture**: Unpadding FlashAttention-2, rotary positional embeddings (RoPE), GeLU activations, 8192-token context window.
- **Masked-Mean Pooling**: For each view $v \in \{\text{main}, \text{sub}, \text{comm}\}$, token sequence $\mathbf{H}_v = \text{ModernBERT}(\mathcal{C}_v) \in \mathbb{R}^{L_v \times 768}$:
  $$
  \mathbf{e}_v = \frac{\sum_{j=1}^{L_v} m_{v, j} \cdot \mathbf{H}_{v, j}}{\sum_{j=1}^{L_v} m_{v, j}} \in \mathbb{R}^{768}
  $$

  where $m_{v, j} \in \{0, 1\}$ is the attention mask.

### 3.4 Multi-View Projection & Fusion

Each 768-d view vector is passed through an independent linear projection head:

$$
\mathbf{z}_{\text{main}} = \mathbf{W}_{\text{main}} \mathbf{e}_{\text{main}} + \mathbf{b}_{\text{main}} \in \mathbb{R}^{256}
$$

$$
\mathbf{z}_{\text{sub}} = \mathbf{W}_{\text{sub}} \mathbf{e}_{\text{sub}} + \mathbf{b}_{\text{sub}} \in \mathbb{R}^{256}
$$

$$
\mathbf{z}_{\text{comm}} = \mathbf{W}_{\text{comm}} \mathbf{e}_{\text{comm}} + \mathbf{b}_{\text{comm}} \in \mathbb{R}^{256}
$$

The projected vectors are concatenated into a fused representation:

$$
\mathbf{z}_{\text{fused}} = [\mathbf{z}_{\text{main}} \,\|\, \mathbf{z}_{\text{sub}} \,\|\, \mathbf{z}_{\text{comm}}] \in \mathbb{R}^{768}
$$

*Architectural Isolation*: $\mathbf{z}_{\text{fused}}$ is strictly dedicated to the neural classification head. It sends no signals to external agents or aggregators.

### 3.5 Primary 4-Class Classification Head

The fused representation feeds into a Multi-Layer Perceptron (MLP):

$$
\mathbf{h}_1 = \text{ReLU}(\mathbf{W}_1 \mathbf{z}_{\text{fused}} + \mathbf{b}_1) \in \mathbb{R}^{256}
$$

$$
\mathbf{h}_2 = \text{Dropout}(\mathbf{h}_1, p=0.30)
$$

$$
\mathbf{z}_{\text{logits}} = \mathbf{W}_2 \mathbf{h}_2 + \mathbf{b}_2 \in \mathbb{R}^4
$$

$$
\mathbf{P}_{\text{ml}} = \text{Softmax}(\mathbf{z}_{\text{logits}}) \in \Delta^3
$$

Training Objective: Cross-entropy loss with AdamW optimizer ($\text{lr} = 2 \times 10^{-5}$, weight decay $0.01$, linear warmup cosine decay).

---

## 4. Source-Code Level Counterfactual Explainability (XAI)

### 4.1 Limitations of Prior Approaches

Standard Gradient-SHAP or Integrated Gradients on raw token embeddings fail on source code for two reasons:

1. **Subword Token Fragmentation**: High attribution on a BPE fragment (e.g., `_self` or `def`) provides zero actionable diagnostic insight to a software auditor.
2. **Latent Dimension SHAP**: Explaining latent projection dimensions (e.g., "Dim #251: +4.85") fails explainability standards, as latent dimensions lack human semantic meaning.

### 4.2 Principled Line-Level Counterfactual Occlusion

Let source code $\mathcal{C}$ consist of an ordered sequence of lines $\mathcal{L} = (\ell_1, \ell_2, \dots, \ell_N)$. Let $c^* = \arg\max \mathbf{P}_{\text{ml}}$ be the winning target class.

1. **Baseline Forward Pass**: Compute baseline probability:

   $$
   P_{\text{base}} = P(Y = c^* \mid \mathcal{L})
   $$
2. **Counterfactual Occlusion**: For each non-empty line $i \in \{1, \dots, N\}$, construct counterfactual code $\mathcal{L}_{\setminus i} = (\ell_1, \dots, \ell_{i-1}, \ell_{i+1}, \dots, \ell_N)$. Recompute the multi-view split, ModernBERT encoding, fusion, and forward pass:

   $$
   P_{\setminus i} = P(Y = c^* \mid \mathcal{L}_{\setminus i})
   $$
3. **Attribution Score Formulation**:

   $$
   \Delta_i = P_{\text{base}} - P_{\setminus i}
   $$

   - **$\Delta_i > 0$ (Positive Driver / $\uparrow$)**: Removing line $i$ **decreases** target probability. Line $i$ provides active evidence supporting classification $c^*$.
   - **$\Delta_i < 0$ (Counter Evidence / $\downarrow$)**: Removing line $i$ **increases** target probability. Line $i$ acts as contradictory evidence resisting classification $c^*$.
   - **$\Delta_i \approx 0$ (Neutral)**: Line $i$ has no measurable impact on classification.
4. **Normalized Score for UI Presentation**:

   $$
   \tilde{\Delta}_i = \frac{\Delta_i}{\max_{k} |\Delta_k| + \epsilon}
   $$

   Visualized in the UI with color intensity mapping and explicit direction arrows ($\uparrow$ positive contribution, $\downarrow$ negative counter-evidence).
5. **Exclusivity Constraint**: To ensure sound scientific methodology, **no SHAP or counterfactual XAI is computed on the secondary LLM-family classification stage**. Line attribution is strictly reserved for the 4-class classifier.

---

## 5. Tool-Equipped Local Agent Forensics

Prior to the confidence gate, two local, tool-using forensic agents examine the **preprocessed and splitted code views** (`main_code`, `sub_functions`, `comments_view`)—**never neural embeddings or fused vectors**—to provide auxiliary evidence:

### 5.1 Agent A: Comment & Style Forensics

- **Role**: Forensic code stylometrist.
- **Input**: The extracted `comments_view` and `main_code` views.
- **Domain**: Identifier casing conventions (camelCase vs. snake_case consistency), comment verbosity ratio, inline explanation style, presence of LLM conversational markers.
- **Deterministic Toolset**:
  1. `get_comments(code)`: Returns full list of comments, line numbers, and comment-to-code ratio.
  2. `get_identifier_names(code)`: Parses AST to extract function, class, and variable names, returning casing distribution.
  3. `check_conversational_markers(code)`: Regex search for known generative AI prompt artifacts.
- **Evidence Verification**: Every empirical claim in Agent A's output must be an exact verbatim substring of a registered tool call output recorded in `toolset.call_log`.

### 5.2 Agent B: Structural & Complexity Forensics

- **Role**: AST and software metrics auditor.
- **Input**: The extracted `main_code` and `sub_functions` views.
- **Domain**: Syntactic structure, cyclomatic complexity, Halstead volume, maximum AST nesting depth, control-flow density.
- **Deterministic Toolset**:
  1. `get_ast_stats(code)`: Computes AST depth, total AST node count, and node type distributions.
  2. `get_cyclomatic_complexity(code)`: Calculates McCabe complexity ($M = E - N + 2P$).
  3. `get_function_signatures(code)`: Analyzes parameter counts, type hints, and return statements.
  4. `compute_halstead_metrics(code)`: Program length, vocabulary, volume, difficulty, and effort.
- **Evidence Verification**: Agent B cannot access raw comment strings; its reasoning is strictly confined to syntactic and structural properties.

---

## 6. Deterministic Consensus Aggregation & Dynamic Confidence Gate

### 6.1 Consensus Aggregation Formulation

To combine continuous neural predictions with symbolic agent outputs without uncalibrated multi-LLM voting, the aggregator expands each agent's scalar prediction into a 4-dimensional discrete probability distribution.

For agent $k \in \{A, B\}$ predicting class $\hat{y}_k \in \mathcal{Y}_4$ with confidence $c_k \in [0, 1]$:

$$
\mathbf{P}_k(c) = \begin{cases} c_k & \text{if } c = \hat{y}_k \\ \frac{1 - c_k}{3} & \text{if } c \neq \hat{y}_k \end{cases}
$$

The final aggregated probability vector $\mathbf{P}_{\text{agg}}$ is computed via static convex combination:

$$
\mathbf{P}_{\text{agg}} = w_{\text{ml}} \cdot \mathbf{P}_{\text{ml}} + w_A \cdot \mathbf{P}_A + w_B \cdot \mathbf{P}_B
$$

where:

$$
w_{\text{ml}} = 0.50, \quad w_A = 0.25, \quad w_B = 0.25, \quad \sum w = 1.0
$$

Final Aggregated Prediction:

$$
\hat{y}_{\text{agg}} = \arg\max_{c \in \mathcal{Y}_4} \mathbf{P}_{\text{agg}}(c), \quad C_{\text{agg}} = \max_{c} \mathbf{P}_{\text{agg}}(c)
$$

### 6.2 Agreement Metric

Inter-source agreement $\mathcal{A} \in \{\text{True}, \text{False}\}$ is defined as:

$$
\mathcal{A} = \left( \hat{y}_{\text{ml}} == \hat{y}_A \right) \lor \left( \hat{y}_{\text{ml}} == \hat{y}_B \right) \lor \left( \hat{y}_A == \hat{y}_B \right)
$$

### 6.3 Confidence Gating Rule

$$
\text{Gate}(\mathbf{P}_{\text{agg}}, \mathcal{A}) = \begin{cases} \text{PASS} & \text{if } C_{\text{agg}} \ge \tau \text{ and } \mathcal{A} == \text{True} \\ \text{TRIGGER\_DEBATE} & \text{otherwise} \end{cases}
$$

Default threshold $\tau = 0.70$.

- If **PASS**: Output $\hat{y}_{\text{agg}}, C_{\text{agg}}$ directly. Inference finishes in $< 180\text{ms}$.
- If **TRIGGER\_DEBATE**: The sample is designated as borderline, ambiguous, or adversarial. The sample is routed to the **LLM Model Council**.

---

## 7. The LLM Model Council (Multi-Agent Debate)

When the confidence gate detects evidentiary deadlock or low confidence, three independent external LLMs convene in a multi-round forensic debate to cross-examine code artifacts and determine authorship.

```
                             [ THE LLM MODEL COUNCIL ]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  [ ADVOCATE ]                      [ SKEPTIC ]                   [ PRESIDING JUDGE ]
Backing: Groq (gpt-oss-20b)   Backing: Gemini (flash-lite)  Backing: OpenRouter (nemotron-3)
Argues: Machine-generated     Argues: Human-written         Impartially weighs claims & delivers
Finds: Structural markers,    Finds: Idiomatic developer    final verdict: Human, Machine, Hybrid,
algorithmic uniformity,       quirks, irregular spacing,    or Adversarial
synthetic fingerprints        human shortcuts
```

### 7.1 The Three Council Member Personas

1. **The Advocate** (Backing: Groq / `gpt-oss-20b`):
   - **Mandate**: Tasked with discovering structural markers, algorithmic uniformity, character entropy, minimal whitespace, and synthetic fingerprints that argue the code is **Machine-generated**.
   - **Key Arguments**: Focuses on low empty-line ratio, character entropy ($4.48$), uniform identifier lengths, and line-length standard deviations typical of template-concatenation generation.
2. **The Skeptic** (Backing: Gemini / `gemini-3.5-flash-lite` or `gemini-2.5-flash`):
   - **Mandate**: Tasked with identifying idiomatic developer quirks, irregular spacing, and human-typical shortcuts that argue the code is **Human-written**.
   - **Key Arguments**: Focuses on structural inconsistencies that LLMs do not make—such as fatal missing constructors (`__init__`), implicit/uninitialized attributes (`self.marks`), and awkward PEP-8 spacing violations resulting from rapid manual terminal typing.
3. **The Presiding Judge** (Backing: OpenRouter / `nemotron-3-super`):
   - **Mandate**: Impartially weighs claims against ground-truth source lines, evaluates confidence divergence, tracks the **Convergence Gap**, and delivers the final binding verdict: `Human`, `Machine`, `Hybrid`, or `Adversarial`.

### 7.2 Multi-Round Deliberation Dynamics

#### Round 1: Cross-Examination & Opening Arguments

- **Advocate Case**: Presents empirical structural fingerprints (e.g., empty-line ratio = 0.09, character entropy = 4.48, average identifier length = 4.79) arguing for machine origin. Sets its confidence score (e.g., $50\%$).
- **Skeptic Case**: Highlights human cognitive drift and omissions (e.g., missing `__init__` constructor leading to immediate `TypeError` at runtime, uninitialized member attributes, inconsistent vertical compression). Sets its confidence score (e.g., $95\%$).
- **Convergence Tracking**: System computes the initial **Convergence Gap** (e.g., $|95\% - 50\%| = 45\text{ pts}$).

#### Round 2: Rebuttal & Counter-Arguments

- **Advocate Rebuttal**: Addresses the Skeptic's missing-constructor claim directly, demonstrating that generative LLMs frequently emit incomplete class snippets when prompted for simple conceptual examples, or rely on runtime dynamic attribute assignment.
- **Skeptic Rebuttal**: Demonstrates why prompt demonstration habits differ from actual developer scratchpad drafting, reinforcing evidence of human authorship.
- **Convergence Monitoring**: The gap narrows as evidence is scrutinized.

#### Final Synthesis & Binding Verdict (Presiding Judge)

- The Presiding Judge reviews the complete debate transcript.
- Cross-checks claimed lines against actual source code lines.
- Renders the final verdict with line-level justifications, updated aggregated probabilities, and deciding factors.

---

## 8. Multi-Key Round-Robin & Resilient LLM Client Architecture

To prevent rate-limit failures (`HTTP 429 Too Many Requests`) during multi-agent Council deliberation:

- **`APIKeyManager`**: Thread-safe round-robin manager supporting up to 5 concurrent Gemini keys (`API_KEY_1` through `API_KEY_5` or `GEMINI_API_KEY_1` through `GEMINI_API_KEY_5`).
- **Cooldown Exponential Backoff**: When a key hits a quota or rate-limit error, it is placed on a 60-second cooldown and the manager seamlessly falls back to the next healthy key in rotation.
- **Zero-Exposure Security Guarantee**: All keys are loaded strictly via backend environment variables. Keys are never printed in logs, never stored in client-accessible responses, and never exposed in frontend bundles.

---

## 9. Modern Glassmorphism Web Interface

The frontend is implemented with React 18, Vite 5, and custom glassmorphism styling:

- **Palette**:
  - Primary Background & Deep Slate: `#384959`
  - Muted Steel Accents: `#6A89A7`
  - Ice Blue Highlights: `#BDDDFC`
  - Active Accent Cyan: `#88BDF2`
- **Persistent Multi-Tab Architecture**:
  1. **Home**: Multi-language code editor with sample loaders (Python, C++, Java), real-time staged progress indicators, 4-class prediction banner, signed line-level XAI code attribution viewer with toggleable positive/negative line filters, and conditional LLM-family card.
  2. **LLM Council**: Interactive forensic debate chamber featuring **Advocate**, **Skeptic**, and **Presiding Judge** profile cards, live multi-round deliberation streams, round-by-round cross-examination tabs, convergence gap tracking, and the Judge's final synthesis.
  3. **Architecture**: Interactive technical documentation featuring the system architecture diagram with zoom/pan modal viewer, mathematical equations, data-flow diagrams, and specifications.
  4. **About (Team G1272)**: Academic profile cards for the project authors, contributions, dataset citations, and research methodology.
- **Persistent State**: Analysis results, debate streams, and code inputs are preserved seamlessly when navigating between tabs.

---

## 10. Quantitative Evaluation & Benchmark Results

### 10.1 Experimental Datasets

- **AICD-T2**: Dataset consisting of 45,000 code snippets labeled by LLM Generator Family (`GPT-4`, `Claude-3`, `LLaMA-3-70B`, `DeepSeek-Coder-33B`, `Mistral-Large`, `Human`). Used for pretraining the ModernBERT encoder and training the conditional family classification head.
- **AICD-T3**: Benchmark evaluation set of 12,000 diverse programs across 8 languages, balanced across `Human`, `Machine`, `Hybrid`, and `Adversarial` (synthetically obfuscated via variable renaming, dead code injection, and prompt-directed style miming).

### 10.2 Empirical Performance Summary

| Architecture / Model Configuration                      |  Macro F1 (%)  |  Accuracy (%)  | Adversarial Robustness (%) |     Inference Latency (CPU)     |
| :------------------------------------------------------ | :-------------: | :-------------: | :------------------------: | :-----------------------------: |
| Standard CodeBERT (Flat Tokenizer)                      |      81.3%      |      82.5%      |           68.2%           |              120ms              |
| RoBERTa-base (Fine-tuned)                               |      83.1%      |      84.0%      |           71.4%           |              135ms              |
| ModernBERT (Single Flat View)                           |      87.4%      |      88.2%      |           77.9%           |              145ms              |
| **AICD-MultiView (Tri-View ML Only)**             | **92.1%** | **93.0%** |      **84.6%**      |         **175ms**         |
| **AICD-MultiView (Full Agentic + 3-LLM Council)** | **94.8%** | **96.2%** |      **91.4%**      | **180ms / 2.8s (Debate)** |

### 10.3 Key Empirical Findings

1. **Tri-View Decomposition (+4.7% F1 over Single-View ModernBERT)**: Isolating `comments_view` prevented the model from being spoofed by clean human comments attached to purely machine-generated code logic.
2. **Agent Forensics on Adversarial Code (+6.8% Robustness)**: Tool-assisted AST and complexity analysis caught 83% of adversarial samples where variable names and comments were deliberately falsified to look human.
3. **Council Dispute Convergence**: For samples failing the confidence gate ($< 0.70$), the 3-member multi-agent debate converged to the correct ground-truth label in **89.2%** of cases within 2 rounds.

---

## 11. Directory Structure

```
AICD_MultiView/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & middleware
│   │   ├── config.py                   # Central configuration & env variable loader
│   │   ├── api/
│   │   │   ├── predict.py              # POST /predict orchestration endpoint
│   │   │   └── explain.py              # POST /explain counterfactual line XAI endpoint
│   │   ├── ml/
│   │   │   ├── cleaner.py              # Source code normalization (Unicode NFC, CRLF)
│   │   │   ├── code_parser.py          # Language-agnostic code parser
│   │   │   ├── code_splitter.py        # Tri-view decomposition (main, sub, comments)
│   │   │   ├── modernbert_encoder.py   # ModernBERT model loader & pooled embedding extractor
│   │   │   ├── classifier.py           # 4-class multi-view projection & MLP head
│   │   │   ├── family_classifier.py    # Conditional LLM-family classification head
│   │   │   └── shap_explainer.py       # Line-level counterfactual occlusion engine
│   │   ├── agents/
│   │   │   ├── base_agent.py           # Base agent execution loop & tool log validator
│   │   │   ├── comment_style_agent.py  # Agent A: Comment & identifier forensics
│   │   │   ├── structural_agent.py     # Agent B: AST & cyclomatic complexity forensics
│   │   │   ├── debate_loop.py          # 3-LLM Council: Advocate, Skeptic, and Judge
│   │   │   ├── tools_comment_style.py  # Deterministic toolset for Agent A
│   │   │   └── tools_structural.py     # Deterministic toolset for Agent B
│   │   ├── aggregation/
│   │   │   ├── aggregator.py           # Deterministic probability vector aggregator
│   │   │   └── confidence_gate.py      # Confidence threshold & agreement gating
│   │   └── llm/
│   │       ├── api_key_manager.py      # Thread-safe 5-key round-robin with cooldown
│   │       ├── gemini_client_manager.py# Gemini API client wrapper with JSON enforcement
│   │       └── mock_llm_client.py      # Offline deterministic mock client for testing
│   ├── tests/                          # Complete pytest suite (31 unit & integration tests)
│   └── requirements.txt                # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Root application with persistent tab state
│   │   ├── api.js                      # Axios client connecting to backend API
│   │   ├── styles.css                  # Custom glassmorphism stylesheet
│   │   └── components/
│   │       ├── Navbar.jsx              # Navigation header with system health monitor
│   │       ├── CodeAttributionViewer.jsx # Line-level XAI code viewer with signed arrows
│   │       ├── CouncilDebate.jsx       # 3-member multi-round interactive debate visualization
│   │       ├── RealtimeProgress.jsx    # Real-time multi-stage pipeline status tracker
│   │       ├── ArchitectureView.jsx    # Technical architecture & diagram viewer
│   │       └── AboutView.jsx           # Academic profiles for Team G1272
│   ├── public/
│   │   └── architecture_diagram.png    # High-resolution system architecture diagram
│   ├── package.json                    # Frontend dependencies (React 18, Vite 5, Lucide)
│   └── vite.config.js                  # Vite bundler configuration
├── models/                             # Trained model checkpoints
│   ├── best_4class_classifier.pt       # Trained 4-class projection & MLP weights (T3)
│   └── model_complete.pth              # Pretrained ModernBERT-base encoder weights (T2)
└── README.md                           # This comprehensive research specification document
```

---

## 12. Instructions for Generating a Full Academic Paper

If you are using an LLM (Claude 3.7 Sonnet, GPT-4o, or Gemini 1.5 Pro) to write a conference or journal paper based on this document, provide the following prompt:

> **Prompt for Academic Paper Synthesis**:
> *"You are an expert researcher in AI and Software Engineering. Using the comprehensive technical specification in this README.md, write a complete, publication-grade academic research paper in IEEE/ACM conference format. The paper must include: (1) Title and Abstract, (2) Introduction & Motivation with threat models, (3) Related Work on AI code detection and multi-agent systems, (4) Proposed Multi-View Architecture and mathematical formulations, (5) Line-Level Counterfactual Explainability, (6) Staged Hierarchical Family Classification, (7) Multi-Agent Forensic Auditing & the 3-LLM Model Council Debate (Advocate, Skeptic, Presiding Judge), (8) Experimental Setup, Benchmarks, and Ablation Studies, (9) Discussion on Adversarial Robustness and Ethical Considerations, and (10) Conclusion. Use precise mathematical notation, algorithmic environments, formal definitions, and reference the empirical gains (+4.7% F1 from tri-view, +6.8% adversarial robustness from agent forensics)."*

---

## 13. Citation & BibTeX

```bibtex
@article{aicd_multiview_2026,
  title={AICD-MultiView: Multi-View Representation Learning with Agentic Forensics and Multi-Agent Debate for Robust AI-Generated Code Attribution},
  author={Team G1272 and Collaborators},
  journal={arXiv preprint arXiv:2609.XXXXX},
  year={2026},
  url={https://github.com/aishprojects/AICD_MultiView}
}
```
