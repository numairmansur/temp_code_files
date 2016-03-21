def latex_matrix_string(
        mean,
        error,
        title,
        row_labels,
        col_labels,
        best_bold_row=True,
        best_bold_column=False):
    '''
Latex Matrix String Generator.

Parameters
----------
mean : array of float array
        An array of float arrays containing mean values
error : array of float array
        An array of float array containing error values
title : string
        Title string of the table
row_labels : string array
        Array of strings for row names
col_labels : string arrays
        Array of strings for column names
best_bold_row : boolean
        If set to true, the minimum mean entry in each row will
        be set to bold.
best_bold_column :
        If set to true, the minimum mean entry in each column will
        be set to bold.
'''
    matrix_string = '''\hline
'''
    for i, row in enumerate(mean):
        column_string = '''{ |c'''
        matrix_string = matrix_string + \
            "\\textbf{" + row_labels[i] + "}& "  # length of row labels and number of rows must be equal
        for j, cell in enumerate(row):
            column_string = column_string + '''|c'''
            ending_string = ''' & ''' if j < len(row) - 1 else ''' \\\ \hline
'''
            if best_bold_row and cell == min(
                    row) and best_bold_column == False:
                matrix_string = matrix_string + \
                    "$\mathbf{" + str(cell) + " \pm " + str(error[i][j]) + "}$" + ending_string
            elif best_bold_column and cell == min([a[j] for a in mean]) and best_bold_row == False:
                matrix_string = matrix_string + \
                    "$\mathbf{" + str(cell) + " \pm " + str(error[i][j]) + "}$" + ending_string
            else:
                matrix_string = matrix_string + "$" + \
                    str(cell) + " \pm " + str(error[i][j]) + "$" + ending_string
    column_string = column_string + '''| }'''
    column_label = ""
    for column in col_labels:
        column_label = column_label + "&\\textbf{" + column + "}"
    latex_string1 = '''\\begin{table}[ht]
\centering
\\begin{tabular}
''' + column_string + '''
\hline
''' + column_label + "\\\ [0.1ex]" + '''
''' + matrix_string + '''\end{tabular}
\\\[-1.5ex]
\caption{''' + title + '''}
\end{table}'''
    return latex_string1


# EXAMPLE
mean = [[1, 6, 5, 7], [12, 4, 6, 13], [9, 8, 7, 10]]
error = [[2, 6, 1, 5], [4, 8, 2, 3], [1, 4, 8, 2]]


print(
    latex_matrix_string(
        mean, error, "Testing Testing", [
            "row1", "row2", "row3"], [
                "col1", "col2", "col3", "col4"]))

