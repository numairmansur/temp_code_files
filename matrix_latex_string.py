'''
author: Numair Mansur (numair.mansur@gmail.com)
Convert a matrix into a latex string. Put that string into a .tex file. also if possible compile that .tex file and generate a pdf page for that matrix.
Input Parameters:
Outputs:
'''

def latex_matrix_string(m,std):
	matrix_string =''''''
	column_string ='''{ '''
	for i,row in enumerate(m):
		column_string = column_string + '''c '''
		for j,cell in enumerate(row):
			ending_string = ''' & ''' if j < len(row)-1 else ''' \\\ '''
			matrix_string = matrix_string + str(cell)+ ending_string
		
	column_string = column_string +'''} '''



	latex_string = '''\\begin{center}
\\begin{tabular}'''+column_string+'''
'''+matrix_string+'''   
\end{tabular}
\end{center}'''

	print(matrix_string)
	return latex_string




mean =[[1,1],[2,7]]
std=[[2,6],[4,8]]
print('---------------------------')
print(latex_matrix_string(mean, std))


