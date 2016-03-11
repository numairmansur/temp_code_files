'''
Latex matrix string generator
'''

def latex_matrix_string(mean,error):
	matrix_string ='''\hline 
'''
	for i,row in enumerate(mean):
		column_string ='''{ '''
		for j,cell in enumerate(row):
			column_string = column_string + '''|c'''
			ending_string = ''' & ''' if j < len(row)-1 else ''' \\\ \hline
'''
			#matrix_string = matrix_string +"$" + str(cell)+" \pm "+str(error[i][j])+"$"+ ending_string       			 #STRING NUMBER 1
			matrix_string = matrix_string +"$" + str(cell)+"{\scriptstyle \pm "+str(error[i][j])+"}$"+ ending_string       #STRING NUMBER 2
	column_string = column_string +'''| }'''
	
	latex_string1 = '''\\begin{tabular}
'''+column_string+'''
'''+matrix_string+'''\end{tabular}''' #Produces the string in multiple lines to increase readibility.
	
	latex_string2 = "\\begin{center}\\begin{tabular}"+column_string+ matrix_string+"\end{tabular}\end{center}"  #Produces the string in one line
	
	return latex_string1



#EXAMPLE
mean =[[1,1,5],[2,7,6],[2,7,7]]
error=[[2,6,1],[4,8,2],[1,4,8]]

print('---------------------------')
print(" ")
print(latex_matrix_string(mean, error))


#TOdo: 
# 1) pass labels for row and columns as a list of strings.
# 2) bold_best_row, best_column
# 3) titlel
# 4) std -> error   DONE
# 5) Add docstring in the same format as in ROBO.
