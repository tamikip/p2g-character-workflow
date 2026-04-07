from pathlib import Path
import sys

from rembg import remove


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: rembg_remove.py <input_path> <output_path>", file=sys.stderr)
        return 1

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(remove(input_path.read_bytes()))
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
