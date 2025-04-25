from python import Python

def grid_str(rows: Int, cols: Int, grid: List[List[Int]]) -> String:
    # Create an empty String
    str = String()

    # Iterate through rows 0 through rows-1
    for row in range(rows):
        # Iterate through columns 0 through cols-1
        for col in range(cols):
            if grid[row][col] == 1:
                str += "*"  # If cell is populated, append an asterisk
            else:
                str += " "  # If cell is not populated, append a space
        if row != rows-1:
            str += "\n"     # Add a newline between rows, but not at the end
    return str

def main():
    num_rows = 8
    num_cols = 8
    glider = List(
        List(0, 1, 1, 1, 1, 1, 1, 0),
        List(0, 1, 0, 0, 0, 0, 0, 1),
        List(0, 1, 0, 0, 0, 0, 0, 1),
        List(0, 1, 0, 0, 0, 0, 0, 1),
        List(0, 1, 1, 1, 1, 1, 1, 0),
        List(0, 1, 0, 0, 0, 0, 0, 0),
        List(0, 1, 0, 0, 0, 0, 0, 0),
        List(0, 1, 0, 0, 0, 0, 0, 0),
    )
    result = grid_str(num_rows, num_cols, glider)
    print(result)

    Python.add_to_path("validate.py")
    validate = Python.import_module("validate")

    validate.test()
