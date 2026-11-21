"""Verifica la estructura de los .sql: bloques $$, parentesis y begin/end.

Un cuerpo plpgsql (do $$ ... $$ o funcion) abre con "begin" y cierra con
"end;", "end $$;" o "end; $$;". El "begin;" suelto es de transaccion.

Uso:  python3 tools/check-sql.py supabase/permisos.sql supabase/negocios.sql
"""

import re
import sys


def check(path):
    with open(path, encoding="utf-8") as fh:
        src = fh.read()

    dollars = src.count("$$")
    dollars_ok = dollars % 2 == 0

    # Quita comentarios de linea y literales de texto simples
    clean = re.sub(r"--[^\n]*", "", src)
    clean = re.sub(r"'[^']*'", "'S'", clean)

    parens_ok = clean.count("(") == clean.count(")")

    # "begin;" suelto en su linea = inicio de transaccion, no de plpgsql.
    # Se tolera \r final (archivos guardados en macOS/Windows).
    tx_begin = len(re.findall(r"^[ \t]*begin[ \t]*;[ \t]*\r?$", clean, re.I | re.M))
    all_begins = len(re.findall(r"^[ \t]*begin[ \t]*\r?$", clean, re.I | re.M))
    begin_blocks = all_begins - tx_begin

    ends = len(re.findall(r"^[ \t]*end[ \t]*(\$\$)?[ \t]*;", clean, re.I | re.M))
    blocks_ok = begin_blocks == ends

    print("\n" + path)
    print("  bloques $$      : %3d  %s" % (dollars, "OK" if dollars_ok else "IMPAR!"))
    print(
        "  parentesis      : %3d / %-3d %s"
        % (clean.count("("), clean.count(")"), "OK" if parens_ok else "DESBALANCE!")
    )
    print(
        "  begin / end     : %3d / %-3d %s"
        % (begin_blocks, ends, "OK" if blocks_ok else "REVISAR")
    )

    return dollars_ok and parens_ok and blocks_ok


if __name__ == "__main__":
    targets = sys.argv[1:] or ["supabase/permisos.sql"]
    results = [check(p) for p in targets]
    print("\n" + ("TODO OK" if all(results) else "HAY PROBLEMAS"))
    sys.exit(0 if all(results) else 1)
