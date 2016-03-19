'''
Latex matrix string generator
'''

def latex_matrix_string(mean,error,title, row_labels, col_labels, best_bold_row=True, best_bold_column=False):
	#check 1:   dimensions of mean and error should be equal.
	#check 2:   dimension of rows must be equal to dimension of the mean
	#check 3:   dmension of columns must be equsl to the number of elements in one element of the mean.
	matrix_string ='''\hline 
'''
	for i,row in enumerate(mean):
		column_string ='''{ |c'''
		matrix_string= matrix_string+"\\textbf{"+row_labels[i]+"}& "
		for j,cell in enumerate(row):
			column_string = column_string + '''|c'''
			ending_string = ''' & ''' if j < len(row)-1 else ''' \\\ \hline
'''
			if best_bold_row and cell == min(row) and best_bold_column == False:
				matrix_string = matrix_string +"$\mathbf{" + str(cell)+" \pm "+str(error[i][j])+"}$"+ ending_string
			elif best_bold_column and cell == min([a[j] for a in mean]) and best_bold_row == False:
				matrix_string = matrix_string +"$\mathbf{" + str(cell)+" \pm "+str(error[i][j])+"}$"+ ending_string
			else:
				matrix_string = matrix_string +"$" + str(cell)+" \pm "+str(error[i][j])+"$"+ ending_string
	column_string = column_string +'''| }'''
	column_label =""
	for column in col_labels:
		column_label = column_label + "&\\textbf{"+column+"}" 
	latex_string1 = '''\\begin{table}[ht]
\centering
\\begin{tabular}
'''+column_string+'''
\hline
'''+column_label+"\\\ [0.1ex]"+'''
'''+matrix_string+'''\end{tabular}
\\\[-1.5ex]
\caption{'''+title+'''}
\end{table}'''
	return latex_string1



#EXAMPLE
mean =[[1,6,5,7],[12,4,6,13],[9,8,7,10]]
error=[[2,6,1,5],[4,8,2,3],[1,4,8,2]]


print( latex_matrix_string(mean, error,"Testing Testing", ["row1","row2","row3"], ["col1","col2","col3","col4"]) )


#TOdo: 
# 5) Add docstring in the same format as in ROBO.
