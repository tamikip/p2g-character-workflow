# Pipeline Overview

## Objective
Run a deterministic workflow from one uploaded character image to a structured set of reusable assets.

## Stage Flow
1. `ingest`
- Receive upload
- Create workflow id
- Store source image

2. `validate`
- Validate type / size / dimensions
- Fail fast with clear error if invalid

3. `remove_background`
- Produce transparent cutout asset

4. `generate_expressions`
- Run three fixed expression jobs:
  - thinking
  - surprise
  - angry

5. `generate_cg`
- Run two CG generation jobs with identity consistency instructions

6. `package_results`
- Build output manifest
- Return URLs/paths + status summary

## Adapter Strategy
Each generation stage should use an adapter interface:
- `mock adapter` for local prototype
- `provider adapter` for real API integration later

This keeps orchestration stable while provider implementations evolve.
