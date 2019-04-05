#!/usr/bin/env python3
"""
Module contains takes in svg path input from the command line and outputs a
reformatted path in output file path_output.txt with all numbers rounded.
This module was created to clean up the output of svg paths drawn with Inkscape.
"""
import re

__author__ = "Elijah Peake <epeake@middlebury.edu>"


if __name__ == "__main__":
    print("Input file path\n")
    original_path = input()
    with open(original_path, 'r') as file:
        original_path = file.read().replace('\n', '')
        
    f = open("path_output.txt", "w")

    numbers = set(["-", "1","2","3","4","5","6","7","8","9","0"])

    path = re.sub(r"[d={}/><\"]", "", original_path)
    path = path.replace(",", " ")

    path_split = [num for num in path.split(" ")
                 if len(num) > 0 and num[0] in numbers]

    path_replacements = {old: str(round(eval(old) * 60)) for old in path_split}

    path = original_path
    for key in path_replacements:
        path = path.replace(key, path_replacements[key])

    new_lines = re.finditer("\s+[mclhvV]", path)

    rep = 0
    for index in new_lines:
        i = index.start() + rep
        path = path[:i] + "\\\n    " + path[i+1:]
        rep += 5  # to offset new characters

    path = re.sub(r"[d={}/><\"]", "", path)
    path = path.replace(",", ", ")

    f.write("d={\"" + path.strip() + "\"}")
    f.close()

    print("\nNew path in path_output.txt\n")
