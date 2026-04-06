# Sample Input / Output

## Input
- 1 character image upload (background allowed)

## Expected Output Package
- `cutout.png`
- `expression-thinking.png`
- `expression-surprise.png`
- `expression-angry.png`
- `cg-01.png`
- `cg-02.png`

## Example Result Metadata (Concept)
```json
{
  "workflow_id": "wf_20260406_001",
  "status": "completed",
  "steps": {
    "validate_input": "success",
    "remove_background": "success",
    "expression_thinking": "success",
    "expression_surprise": "success",
    "expression_angry": "success",
    "cg_01": "success",
    "cg_02": "success"
  },
  "outputs": {
    "cutout": "outputs/wf_20260406_001/cutout.png",
    "expressions": {
      "thinking": "outputs/wf_20260406_001/expression-thinking.png",
      "surprise": "outputs/wf_20260406_001/expression-surprise.png",
      "angry": "outputs/wf_20260406_001/expression-angry.png"
    },
    "cg_outputs": [
      "outputs/wf_20260406_001/cg-01.png",
      "outputs/wf_20260406_001/cg-02.png"
    ]
  }
}
```
