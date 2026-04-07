from pathlib import Path
import sys

from rembg import new_session, remove


def main() -> int:
    if len(sys.argv) not in (3, 4):
        print("Usage: rembg_remove.py <input_path> <output_path> [model_name]", file=sys.stderr)
        return 1

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    model_name = sys.argv[3] if len(sys.argv) == 4 else "isnet-anime"

    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    session = new_session(model_name=model_name)
    output_path.write_bytes(remove(input_path.read_bytes(), session=session))
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
